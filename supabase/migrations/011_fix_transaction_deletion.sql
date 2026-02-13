-- Migration to fix transaction deletion and stock management
-- This migration adds missing RLS policies for deleting transactions and items
-- and adds the increment_stock function.

-- 1. Add increment_stock function for atomic stock updates
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock + quantity
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Add missing RLS policies for DELETE on transactions
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- 3. Add missing RLS policies for DELETE on transaction_items
DROP POLICY IF EXISTS "Users can delete own transaction_items" ON transaction_items;
CREATE POLICY "Users can delete own transaction_items" ON transaction_items
    FOR DELETE USING (transaction_id IN (
        SELECT t.id FROM transactions t 
        JOIN stores s ON s.id = t.store_id 
        WHERE s.user_id = auth.uid()
    ));

-- 4. Ensure stock_movements has a policy for delete if needed (usually just insert)
-- But for completeness, let's make sure it's consistent.
