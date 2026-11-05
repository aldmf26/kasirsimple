-- Security fix: store owners could previously UPDATE their own `stores` row
-- without column restrictions, so a client could set is_admin = true or extend
-- subscription_until / subscription_status from the browser console.
--
-- 1. public.is_super_admin(): SECURITY DEFINER lookup that bypasses RLS, so the
--    stores policies no longer query `stores` from inside a `stores` policy
--    (which Postgres rejects as infinite recursion).
-- 2. A BEFORE INSERT/UPDATE trigger that only lets a super admin (or a
--    server-side session without auth.uid(), e.g. SQL editor / service role)
--    change is_admin and subscription_* columns.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT s.is_admin FROM public.stores s WHERE s.user_id = auth.uid() LIMIT 1),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_store_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No JWT user (SQL editor, service role, migrations): trusted.
  IF auth.uid() IS NULL OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Same values create_store_for_current_user() uses for a new store.
    NEW.is_admin := false;
    NEW.subscription_status := 'trial';
    NEW.subscription_plan := 'trial';
    NEW.subscription_until := NOW() + INTERVAL '7 days';
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.subscription_until IS DISTINCT FROM OLD.subscription_until
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Tidak diizinkan mengubah status admin atau langganan'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_store_privileged_columns ON public.stores;
CREATE TRIGGER protect_store_privileged_columns
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_store_privileged_columns();

-- Rebuild the admin-aware policies from 013 on top of the helper.
DROP POLICY IF EXISTS "Enable select for users or admins" ON public.stores;
CREATE POLICY "Enable select for users or admins" ON public.stores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Enable update for users or admins" ON public.stores;
CREATE POLICY "Enable update for users or admins" ON public.stores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Enable select for users or admins" ON public.transactions;
CREATE POLICY "Enable select for users or admins" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    OR public.is_super_admin()
  );
