-- ============================================
-- RLS FIX SCRIPT - Run if RLS not working
-- ============================================
-- If you're getting "select policy with check expression (false)" errors,
-- run this script in Supabase SQL Editor

-- ============================================
-- Step 1: Verify RLS is Enabled
-- ============================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('stores', 'categories', 'products', 'transactions', 'transaction_items', 'stock_movements', 'printer_settings');

-- Expected output: All should have rowsecurity = true
-- If not, enable with:
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: DROP Existing Policies (if corrupted)
-- ============================================
-- STORES
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can create own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

-- CATEGORIES
DROP POLICY IF EXISTS "Users can view categories of their stores" ON categories;
DROP POLICY IF EXISTS "Users can create categories in their stores" ON categories;
DROP POLICY IF EXISTS "Users can update categories in their stores" ON categories;
DROP POLICY IF EXISTS "Users can delete categories in their stores" ON categories;

-- PRODUCTS
DROP POLICY IF EXISTS "Users can view products of their stores" ON products;
DROP POLICY IF EXISTS "Users can create products in their stores" ON products;
DROP POLICY IF EXISTS "Users can update products in their stores" ON products;
DROP POLICY IF EXISTS "Users can delete products in their stores" ON products;

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can view transactions of their stores" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions in their stores" ON transactions;
DROP POLICY IF EXISTS "Users can view their transaction details" ON transactions;

-- TRANSACTION ITEMS
DROP POLICY IF EXISTS "Users can view transaction items from their stores" ON transaction_items;

-- STOCK MOVEMENTS
DROP POLICY IF EXISTS "Users can view stock movements of their products" ON stock_movements;
DROP POLICY IF EXISTS "Users can create stock movements for their products" ON stock_movements;

-- PRINTER SETTINGS
DROP POLICY IF EXISTS "Users can view printer settings of their stores" ON printer_settings;
DROP POLICY IF EXISTS "Users can update printer settings of their stores" ON printer_settings;
DROP POLICY IF EXISTS "Users can insert printer settings for their stores" ON printer_settings;

-- ============================================
-- Step 3: Recreate All Policies (FRESH)
-- ============================================

-- STORES TABLE
CREATE POLICY "Users can view own stores" ON stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stores" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON stores
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores" ON stores
    FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES TABLE
CREATE POLICY "Users can view categories of their stores" ON categories
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create categories in their stores" ON categories
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update categories in their stores" ON categories
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete categories in their stores" ON categories
    FOR DELETE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- PRODUCTS TABLE
CREATE POLICY "Users can view products of their stores" ON products
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create products in their stores" ON products
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update products in their stores" ON products
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete products in their stores" ON products
    FOR DELETE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- TRANSACTIONS TABLE
CREATE POLICY "Users can view transactions of their stores" ON transactions
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create transactions in their stores" ON transactions
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- TRANSACTION ITEMS TABLE
CREATE POLICY "Users can view transaction items from their stores" ON transaction_items
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions WHERE store_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
    );

-- STOCK MOVEMENTS TABLE
CREATE POLICY "Users can view stock movements of their products" ON stock_movements
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM products WHERE store_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create stock movements for their products" ON stock_movements
    FOR INSERT WITH CHECK (
        product_id IN (
            SELECT id FROM products WHERE store_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
    );

-- PRINTER SETTINGS TABLE
CREATE POLICY "Users can view printer settings of their stores" ON printer_settings
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update printer settings of their stores" ON printer_settings
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert printer settings for their stores" ON printer_settings
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- ============================================
-- Step 4: Verify Policies Created
-- ============================================
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: 4-7 policies per table

-- ============================================
-- Step 5: Test RLS
-- ============================================

-- Get current user ID for testing
SELECT auth.uid() as my_user_id;

-- Try to select stores (should work if you created one)
SELECT id, name, user_id FROM stores WHERE user_id = auth.uid();

-- Try to select products
SELECT id, name, store_id FROM products WHERE store_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
);

-- ============================================
-- Done! If still having issues:
-- 1. Check browser console for exact error
-- 2. Check Supabase logs
-- 3. Verify JWT token is valid
-- 4. Check user_id matches in database
-- ============================================
