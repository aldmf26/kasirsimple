-- Add favorite flag for quick-access products in POS.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

UPDATE public.products
SET is_favorite = false
WHERE is_favorite IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_is_favorite
ON public.products(store_id, is_favorite)
WHERE is_favorite = true;
