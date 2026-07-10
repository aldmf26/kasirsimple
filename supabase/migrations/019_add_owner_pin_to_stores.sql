-- Store owner PIN hash for local admin-gate features.
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS owner_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS owner_pin_salt TEXT;

COMMENT ON COLUMN public.stores.owner_pin_hash IS 'SHA-256 hash for Owner PIN admin gate. PIN is never stored as plain text.';
COMMENT ON COLUMN public.stores.owner_pin_salt IS 'Random salt used for Owner PIN hash.';
