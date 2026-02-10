-- Add discount and tax settings to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS discount_tax_settings JSONB DEFAULT NULL;

-- Comment explaining the JSON structure
COMMENT ON COLUMN stores.discount_tax_settings IS 'JSON object containing discount and tax settings:
{
  "discount_global": {
    "enabled": boolean,
    "percent": number
  },
  "discount_nominal": {
    "enabled": boolean,
    "min_amount": number (e.g., 100000),
    "discount_percent": number
  },
  "tax": {
    "enabled": boolean,
    "percent": number
  },
  "ppn": {
    "enabled": boolean,
    "percent": number
  }
}';
