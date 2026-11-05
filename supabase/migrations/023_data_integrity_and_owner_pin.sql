-- Data integrity + owner PIN hardening. Run after 022.
--
-- 1. transaction_number unique per store (was globally unique, so two stores
--    could not both have TRX-YYYYMMDD-001).
-- 2. transactions.status replaces the "[RETUR]" prefix in notes.
-- 3. adjust_product_stock(): atomic stock change (row lock), so two devices
--    selling the same product cannot overwrite each other's stock.
-- 4. customers table: migration was missing; production returned
--    "permission denied for table customers".
-- 5. Owner PIN hash moved out of `stores` (which every logged-in session can
--    read) into a table only SECURITY DEFINER functions can touch, hashed with
--    bcrypt and verified server-side.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. Transaction number unique per store
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_transaction_number_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_store_id_transaction_number_key'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_store_id_transaction_number_key
      UNIQUE (store_id, transaction_number);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Transaction status column
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check CHECK (status IN ('completed', 'returned'));

UPDATE public.transactions
SET status = 'returned'
WHERE status = 'completed' AND notes LIKE '[RETUR]%';

CREATE INDEX IF NOT EXISTS idx_transactions_store_status_created
  ON public.transactions (store_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Atomic stock adjustment (SECURITY INVOKER: products RLS still applies)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id UUID,
  p_delta INTEGER
)
RETURNS TABLE (stock_before INTEGER, stock_after INTEGER)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_before INTEGER;
  v_after INTEGER;
BEGIN
  SELECT COALESCE(p.stock, 0) INTO v_before
  FROM public.products p
  WHERE p.id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  v_after := GREATEST(0, v_before + p_delta);

  UPDATE public.products
  SET stock = v_after, updated_at = NOW()
  WHERE id = p_product_id;

  RETURN QUERY SELECT v_before, v_after;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_product_stock(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_store_id ON public.customers (store_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers select own store" ON public.customers;
CREATE POLICY "Customers select own store" ON public.customers
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers insert own store" ON public.customers;
CREATE POLICY "Customers insert own store" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers update own store" ON public.customers;
CREATE POLICY "Customers update own store" ON public.customers
  FOR UPDATE TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers delete own store" ON public.customers;
CREATE POLICY "Customers delete own store" ON public.customers
  FOR DELETE TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 5. Owner PIN
-- ---------------------------------------------------------------------------
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS owner_pin_set BOOLEAN NOT NULL DEFAULT false;

-- No policies + no grants: only the SECURITY DEFINER functions below can read it.
CREATE TABLE IF NOT EXISTS public.store_owner_pins (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  -- 'bcrypt:<crypt hash>' or legacy 'sha256:<salt>:<hex>' (upgraded on first verify)
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.store_owner_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_owner_pins FROM anon, authenticated;

-- Move existing client-side SHA-256 hashes out of `stores`.
INSERT INTO public.store_owner_pins (store_id, pin_hash)
SELECT id, 'sha256:' || owner_pin_salt || ':' || owner_pin_hash
FROM public.stores
WHERE owner_pin_hash IS NOT NULL AND owner_pin_salt IS NOT NULL
ON CONFLICT (store_id) DO NOTHING;

UPDATE public.stores
SET owner_pin_set = true
WHERE id IN (SELECT store_id FROM public.store_owner_pins);

UPDATE public.stores
SET owner_pin_hash = NULL, owner_pin_salt = NULL
WHERE owner_pin_hash IS NOT NULL OR owner_pin_salt IS NOT NULL;

CREATE OR REPLACE FUNCTION public.owner_pin_matches(p_store_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash TEXT;
  v_parts TEXT[];
BEGIN
  SELECT pin_hash INTO v_hash FROM public.store_owner_pins WHERE store_id = p_store_id;
  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  IF v_hash LIKE 'bcrypt:%' THEN
    RETURN crypt(p_pin, substr(v_hash, 8)) = substr(v_hash, 8);
  END IF;

  -- Legacy format written by the old client code: sha256(salt || ':' || pin)
  v_parts := string_to_array(v_hash, ':');
  IF v_parts[1] = 'sha256'
     AND encode(digest(v_parts[2] || ':' || p_pin, 'sha256'), 'hex') = v_parts[3] THEN
    UPDATE public.store_owner_pins
    SET pin_hash = 'bcrypt:' || crypt(p_pin, gen_salt('bf', 8)), updated_at = NOW()
    WHERE store_id = p_store_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.owner_pin_matches(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_owner_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM public.stores WHERE user_id = auth.uid() LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Toko tidak ditemukan';
  END IF;
  -- bcrypt cost makes each guess slow; no way to read the hash from the client.
  RETURN public.owner_pin_matches(v_store_id, p_pin);
END;
$$;
REVOKE ALL ON FUNCTION public.verify_owner_pin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_owner_pin(TEXT) TO authenticated;

-- Changing an existing PIN needs the current PIN, or a password login in the
-- last 10 minutes (JWT "amr" claim), which is what "Lupa PIN" does.
CREATE OR REPLACE FUNCTION public.set_owner_pin(p_new_pin TEXT, p_current_pin TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_store_id UUID;
  v_has_pin BOOLEAN;
  v_recent_password BOOLEAN;
BEGIN
  IF p_new_pin IS NULL OR p_new_pin !~ '^\d{4,6}$' THEN
    RAISE EXCEPTION 'PIN harus 4-6 angka';
  END IF;

  SELECT id INTO v_store_id FROM public.stores WHERE user_id = auth.uid() LIMIT 1;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Toko tidak ditemukan';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.store_owner_pins WHERE store_id = v_store_id)
  INTO v_has_pin;

  IF v_has_pin THEN
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(auth.jwt() -> 'amr', '[]'::jsonb)) AS a
      WHERE a ->> 'method' = 'password'
        AND (a ->> 'timestamp')::BIGINT > EXTRACT(EPOCH FROM NOW() - INTERVAL '10 minutes')
    ) INTO v_recent_password;

    IF NOT v_recent_password
       AND (p_current_pin IS NULL OR NOT public.owner_pin_matches(v_store_id, p_current_pin)) THEN
      RAISE EXCEPTION 'PIN lama salah';
    END IF;
  END IF;

  INSERT INTO public.store_owner_pins (store_id, pin_hash, updated_at)
  VALUES (v_store_id, 'bcrypt:' || crypt(p_new_pin, gen_salt('bf', 8)), NOW())
  ON CONFLICT (store_id) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash, updated_at = NOW();

  UPDATE public.stores
  SET owner_pin_set = true, owner_pin_enabled = true
  WHERE id = v_store_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_owner_pin(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_owner_pin(TEXT, TEXT) TO authenticated;
