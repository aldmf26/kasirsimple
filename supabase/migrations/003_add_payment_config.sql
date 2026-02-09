-- Add payment configuration columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS enabled_payment_methods TEXT DEFAULT '["cash"]',
ADD COLUMN IF NOT EXISTS bank_accounts TEXT DEFAULT '[]';

-- Add comment to explain the structure
COMMENT ON COLUMN stores.enabled_payment_methods IS 'JSON array of enabled payment methods: ["cash", "qris", "card"]';
COMMENT ON COLUMN stores.bank_accounts IS 'JSON array of bank accounts for card payments: [{"id": "...", "accountName": "...", "bank": "...", "accountNumber": "..."}]';
