-- Add subscription columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMPTZ DEFAULT (now() + interval '7 days');
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial';

-- Update RLS if needed (usually stores table already has RLS based on user_id)
-- Ensure users can see their own subscription data
COMMENT ON COLUMN stores.subscription_status IS 'Status langganan: trial, active, expired';
COMMENT ON COLUMN stores.subscription_until IS 'Waktu berakhirnya masa langganan';
COMMENT ON COLUMN stores.subscription_plan IS 'Nama paket langganan: monthly, yearly, custom';
