-- Allow store owners to turn the Owner PIN gate on or off.
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS owner_pin_enabled BOOLEAN DEFAULT false;

UPDATE public.stores
SET owner_pin_enabled = false
WHERE owner_pin_enabled IS NULL;

COMMENT ON COLUMN public.stores.owner_pin_enabled IS 'When true, sensitive menus require Owner PIN. When false, no PIN gate is shown.';
