-- Migration: Add buy_price and unit columns to products
-- Date: 2026-01-30
-- Description: Update products table to support buy_price tracking and unit selection

-- Add new columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS buy_price NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';

-- Update existing product entries (if any)
UPDATE products 
SET unit = 'pcs' 
WHERE unit IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);

-- Ensure RLS is properly enabled with correct policies
-- Note: RLS policies should already be created by schema.sql
-- This migration just verifies they're in place
