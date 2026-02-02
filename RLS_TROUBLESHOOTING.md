# Fix: Supabase RLS & Data Access Issues

## ❌ Problem: "Can't Access Any Data After Login"

### Root Cause

User bisa login tapi tidak bisa akses data karena RLS policies belum properly configured.

### ✅ Solution Checklist

#### Step 1: Verify RLS is Enabled

```sql
-- Run di Supabase SQL Editor
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public';

-- Check RLS status untuk setiap table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stores', 'products', 'categories', 'transactions');
```

**Expected Output**: rowsecurity should be `true` for all tables

#### Step 2: Verify Policies Exist

1. Dashboard → Authentication → Policies
2. Untuk setiap table, pastikan ada policies:
   - "Users can view own stores" (SELECT)
   - "Users can create own stores" (INSERT)
   - "Users can update own stores" (UPDATE)
   - "Users can delete own stores" (DELETE)

Jika tidak ada, re-run schema.sql:

```sql
-- Re-enable RLS dan recreate policies
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can create own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

-- Recreate policies
CREATE POLICY "Users can view own stores" ON stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stores" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON stores
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores" ON stores
    FOR DELETE USING (auth.uid() = user_id);
```

#### Step 3: Test RLS dengan SQL Console

```sql
-- 1. Set fake JWT untuk testing
SELECT set_config('request.jwt.claims',
  json_build_object('sub', 'test-user-id')::text, true);

-- 2. Test query
SELECT * FROM stores;

-- Expected: Empty result (karena test-user-id tidak punya stores)

-- 3. Check auth.uid() works
SELECT auth.uid();
-- Expected: 'test-user-id'
```

#### Step 4: Create Test Store

```sql
-- Get current user ID
SELECT auth.uid() as current_user_id;

-- Insert test store dengan user ID yang benar
INSERT INTO stores (user_id, name, address, phone)
VALUES (
  auth.uid(),  -- Use actual auth.uid()
  'Toko Test',
  'Jl. Test 123',
  '0812345678'
);

-- Verify dapat lihat
SELECT * FROM stores;
```

#### Step 5: Test di Application

1. Signup dengan user baru
2. Cek browser console untuk errors:
   ```javascript
   // Di browser console
   localStorage.getItem("sb-tokens");
   ```
3. Check Supabase logs:
   - Dashboard → Logs
   - Filter untuk user ID
   - Check untuk policy violations

## ❌ Problem: "User can Login but Can't Create Store"

### Solution

Check INSERT policy:

```sql
-- Verify INSERT policy exists
SELECT * FROM pg_policies WHERE tablename = 'stores';

-- If missing, create it:
CREATE POLICY "Users can create own stores" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

Test di SQL console:

```sql
-- Set auth context
SELECT set_config('request.jwt.claims',
  json_build_object('sub', auth.uid())::text, true);

-- Try insert
INSERT INTO stores (user_id, name, address, phone)
VALUES (auth.uid(), 'Test', 'Address', '08123');
```

## ❌ Problem: "Can See Products dari Toko Lain"

### Root Cause

RLS policy untuk products tidak benar

### Solution

```sql
-- Check current policy
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Drop and recreate dengan benar
DROP POLICY IF EXISTS "Users can view products of their stores" ON products;

CREATE POLICY "Users can view products of their stores" ON products
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );
```

## ❌ Problem: "Transactions Not Saving"

### Checklist

1. Check auth.uid() in useTransactions:

   ```typescript
   const user = useSupabaseUser();
   console.log("Current user:", user.value?.id);
   ```

2. Verify store exists:

   ```typescript
   const { store } = useStore();
   console.log("Current store:", store.value?.id);
   ```

3. Check transaction policy:

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'transactions';
   ```

4. Test transaction insert:
   ```sql
   INSERT INTO transactions
   (store_id, transaction_number, subtotal, total, paid, change, payment_method, created_by)
   VALUES
   ('store-uuid', 'TRX-20260130-001', 50000, 50000, 50000, 0, 'cash', auth.uid())
   RETURNING *;
   ```

## ❌ Problem: "Stock Movements Not Logging"

### Solution

Verify stock_movements policy:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'stock_movements';

-- If not, enable it
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policy
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
```

## 🔧 Full RLS Verification Script

Run ini di SQL Editor untuk check semua tables:

```sql
-- Enable RLS for all main tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🧪 Troubleshooting Checklist

- [ ] RLS enabled on all tables (`rowsecurity = true`)
- [ ] All policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] Test queries work in SQL Editor
- [ ] auth.uid() returns correct user ID
- [ ] Store created with correct user_id
- [ ] Products linked to correct store_id
- [ ] No syntax errors in policies
- [ ] JWT token valid in browser
- [ ] NUXT_PUBLIC_SUPABASE_URL correct
- [ ] NUXT_PUBLIC_SUPABASE_ANON_KEY correct

## 📊 Debug Queries

### List all stores for current user

```sql
SELECT set_config('request.jwt.claims',
  json_build_object('sub', auth.uid())::text, true);

SELECT id, name, user_id FROM stores WHERE user_id = auth.uid();
```

### List all products for user's stores

```sql
SELECT p.id, p.name, p.store_id
FROM products p
WHERE p.store_id IN (
  SELECT id FROM stores WHERE user_id = auth.uid()
);
```

### Check transaction history

```sql
SELECT t.id, t.transaction_number, t.total, t.created_at
FROM transactions t
WHERE t.store_id IN (
  SELECT id FROM stores WHERE user_id = auth.uid()
)
ORDER BY t.created_at DESC
LIMIT 10;
```

## 🆘 Still Not Working?

### Enable Query Logging

```sql
-- Enable query logging
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_duration = 'on';

-- Check logs di Supabase Dashboard → Logs → Postgres
```

### Clear Browser Cache

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### Restart Application

```bash
# Kill dev server
Ctrl + C

# Clear .nuxt cache
rm -rf .nuxt

# Restart
npm run dev
```

### Reapply Schema

```sql
-- If all else fails, drop and recreate tables
-- WARNING: This will delete all data!

-- Copy data first if needed
-- Then run fresh schema.sql
```

---

**Need Help?**

- Check Supabase Docs: https://supabase.com/docs/guides/auth/row-level-security
- Check PostgreSQL Docs: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Supabase Discord: https://discord.supabase.com
