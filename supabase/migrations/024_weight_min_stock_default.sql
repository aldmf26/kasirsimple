-- Weight products store stock in grams, but min_stock was always the column
-- default 5 (the product form had no field for it), i.e. a 5 gram warning.
-- Move those untouched defaults to 500 gram. Optional: the app works without it.
UPDATE public.products
SET min_stock = 500
WHERE stock_unit = 'gram' AND min_stock = 5;
