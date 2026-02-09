-- Add show_product_images column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS show_product_images BOOLEAN DEFAULT true;
