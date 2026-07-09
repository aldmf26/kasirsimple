-- RLS helpers used by app policies.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT s.is_admin
    FROM public.stores s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.can_access_store(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT true
    FROM public.stores s
    WHERE s.id = target_store_id
      AND (s.user_id = auth.uid() OR public.is_current_user_admin())
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.create_store_for_current_user(
  store_name TEXT,
  store_business_type TEXT DEFAULT 'retail',
  store_address TEXT DEFAULT NULL,
  store_phone TEXT DEFAULT NULL
)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  created_store public.stores;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT * INTO created_store
  FROM public.stores
  WHERE user_id = current_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN created_store;
  END IF;

  INSERT INTO public.stores (
    user_id,
    name,
    business_type,
    address,
    phone,
    is_active,
    subscription_status,
    subscription_plan,
    subscription_until
  )
  VALUES (
    current_user_id,
    store_name,
    COALESCE(NULLIF(store_business_type, ''), 'retail'),
    NULLIF(store_address, ''),
    NULLIF(store_phone, ''),
    true,
    'trial',
    'trial',
    NOW() + INTERVAL '7 days'
  )
  RETURNING * INTO created_store;

  INSERT INTO public.printer_settings (store_id)
  VALUES (created_store.id)
  ON CONFLICT (store_id) DO NOTHING;

  RETURN created_store;
END;
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_store(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_store_for_current_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_store(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_store_for_current_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Create shifts table for open/close cashier sessions.
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  closing_balance_actual NUMERIC(12, 2) DEFAULT 0,
  closing_balance_expected NUMERIC(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_store_id ON public.shifts(store_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON public.shifts(start_time DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_one_open_per_user_store
  ON public.shifts(store_id, user_id)
  WHERE status = 'open';

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shifts select accessible store" ON public.shifts;
DROP POLICY IF EXISTS "Shifts insert accessible store" ON public.shifts;
DROP POLICY IF EXISTS "Shifts update accessible store" ON public.shifts;
DROP POLICY IF EXISTS "Shifts delete accessible store" ON public.shifts;

CREATE POLICY "Shifts select accessible store" ON public.shifts
  FOR SELECT TO authenticated
  USING (public.can_access_store(store_id));

CREATE POLICY "Shifts insert accessible store" ON public.shifts
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_store(store_id) AND user_id = auth.uid());

CREATE POLICY "Shifts update accessible store" ON public.shifts
  FOR UPDATE TO authenticated
  USING (public.can_access_store(store_id))
  WITH CHECK (public.can_access_store(store_id));

CREATE POLICY "Shifts delete accessible store" ON public.shifts
  FOR DELETE TO authenticated
  USING (public.can_access_store(store_id));

DROP TRIGGER IF EXISTS update_shifts_updated_at ON public.shifts;
CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
