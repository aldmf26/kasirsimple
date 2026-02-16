-- Add is_admin column to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update RLS for stores to allow admins to see all stores
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON stores;
CREATE POLICY "Enable select for users or admins" ON stores
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id OR (SELECT is_admin FROM stores WHERE user_id = auth.uid() LIMIT 1) = true);

-- Update RLS for stores to allow admins to update all stores (for subscription)
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON stores;
CREATE POLICY "Enable update for users or admins" ON stores
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR (SELECT is_admin FROM stores WHERE user_id = auth.uid() LIMIT 1) = true)
    WITH CHECK (auth.uid() = user_id OR (SELECT is_admin FROM stores WHERE user_id = auth.uid() LIMIT 1) = true);

-- Update RLS for transactions to allow admins to see all transactions
DROP POLICY IF EXISTS "Users can view transactions of their stores" ON transactions;
CREATE POLICY "Enable select for users or admins" ON transactions
    FOR SELECT
    TO authenticated
    USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) 
        OR 
        (SELECT is_admin FROM stores WHERE user_id = auth.uid() LIMIT 1) = true
    );

-- Mark a specific user as admin (You can change this email or run manually in Supabase)
-- UPDATE stores SET is_admin = true WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
