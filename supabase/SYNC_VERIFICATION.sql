-- ============================================
-- SUPABASE SYNC VERIFICATION SCRIPT
-- Jalankan di SQL Editor Supabase
-- ============================================

-- Bagian 1: Debug Info
-- Jalankan untuk melihat authenticated user
SELECT 'Current Auth User' as info, auth.uid()::text as user_id;

-- Bagian 2: Cek Stores
SELECT 
  'Stores Check' as check_type,
  COUNT(*) as count,
  MAX(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM stores
WHERE user_id = auth.uid();

-- Bagian 3: Detail Stores
SELECT 
  id,
  name,
  user_id,
  is_active,
  created_at
FROM stores
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Bagian 4: Cek Products per Store
SELECT 
  s.id as store_id,
  s.name as store_name,
  COUNT(p.id) as product_count,
  SUM(CASE WHEN p.is_active THEN 1 ELSE 0 END) as active_products
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
WHERE s.user_id = auth.uid()
GROUP BY s.id, s.name;

-- Bagian 5: Sample Products
SELECT 
  id,
  store_id,
  name,
  sku,
  price,
  stock,
  is_active,
  created_at
FROM products
WHERE store_id IN (
  SELECT id FROM stores WHERE user_id = auth.uid()
)
ORDER BY created_at DESC
LIMIT 10;

-- Bagian 6: Cek Categories per Store
SELECT 
  s.id as store_id,
  s.name as store_name,
  COUNT(c.id) as category_count
FROM stores s
LEFT JOIN categories c ON c.store_id = s.id
WHERE s.user_id = auth.uid()
GROUP BY s.id, s.name;

-- Bagian 7: Check RLS Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- PERBAIKAN (jika diperlukan)
-- ============================================

-- FIX 1: Jika ada store dengan user_id NULL
-- Ganti <AUTH_USER_ID> dengan UUID dari Bagian 1
/*
UPDATE stores 
SET user_id = '<AUTH_USER_ID>'
WHERE user_id IS NULL AND name = 'aldi store';
*/

-- FIX 2: Jika products memiliki store_id salah
-- Ganti <STORE_ID> dengan UUID dari Bagian 3
/*
UPDATE products 
SET store_id = '<STORE_ID>'
WHERE store_id IS NULL 
  OR store_id NOT IN (SELECT id FROM stores WHERE user_id = auth.uid());
*/

-- FIX 3: Aktifkan kembali produk jika inactive
/*
UPDATE products 
SET is_active = true
WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  AND is_active = false;
*/

-- FIX 4: Aktifkan kembali store jika inactive
/*
UPDATE stores 
SET is_active = true
WHERE user_id = auth.uid() 
  AND is_active = false;
*/
