-- Add discount and tax fields to transactions table if they don't already exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS discount_from_settings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppn NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS ppn_percentage NUMERIC;

-- If tax column doesn't exist (older schema), add it
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;

-- Comments explaining the new fields
COMMENT ON COLUMN transactions.discount_from_settings IS 'Discount amount applied from store settings (global + nominal)';
COMMENT ON COLUMN transactions.ppn IS 'PPN (Pajak Pertambahan Nilai) amount applied';  
COMMENT ON COLUMN transactions.tax IS 'Tax (Pajak) amount applied';
COMMENT ON COLUMN transactions.tax_percentage IS 'Tax percentage from store settings at time of transaction';
COMMENT ON COLUMN transactions.ppn_percentage IS 'PPN percentage from store settings at time of transaction';
