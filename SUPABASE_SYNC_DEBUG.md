# Panduan Sinkronisasi Supabase - Kasir Simple

## ✅ Perubahan yang Sudah Dilakukan

1. **Nonaktifkan Dummy Mode** ✓
   - File: `app/composables/useDummyMode.ts`
   - Perubahan: `isDummyMode` dari `true` → `false`
   - Sekarang app akan mengambil data dari Supabase, bukan dummy data

## 🔍 Checklist Verifikasi di Supabase

Buka Supabase Dashboard dan ikuti langkah berikut:

### 1. Verifikasi Auth User

```
Menu: Authentication → Users
```

- [ ] Cari user yang sudah login
- [ ] Catat `user_id` (UUID format)
- [ ] Pastikan email verified (jika diperlukan)

### 2. Verifikasi Stores Table

```
Menu: SQL Editor → Jalankan query:

SELECT id, user_id, name, is_active FROM stores;
```

- [ ] Pastikan ada store dengan nama "aldi store"
- [ ] **PENTING**: `user_id` harus sesuai dengan user yang login
- [ ] `is_active` harus `true`

**Jika store belum ada atau user_id salah, jalankan:**

```sql
-- Ganti <AUTH_USER_ID> dengan UUID user yang login
UPDATE stores
SET user_id = '<AUTH_USER_ID>'
WHERE name = 'aldi store';
```

### 3. Verifikasi Products Table

```
Menu: SQL Editor → Jalankan query:

SELECT id, store_id, name, is_active
FROM products
LIMIT 30;
```

- [ ] Pastikan ada 30 produk
- [ ] **PENTING**: `store_id` harus sesuai dengan UUID store "aldi store"
- [ ] `is_active` harus `true` untuk semua produk

**Jika store_id salah, jalankan:**

```sql
-- Ganti <STORE_ID> dengan UUID dari store "aldi store"
UPDATE products
SET store_id = '<STORE_ID>'
WHERE store_id IS NULL OR store_id = '';
```

### 4. Verifikasi Row Level Security (RLS)

```
Menu: SQL Editor → Jalankan dengan authenticated session (pastikan login):

SELECT * FROM stores;
SELECT * FROM products LIMIT 10;
SELECT * FROM categories;
```

- [ ] Queries harus return data (tidak empty)
- [ ] Jika error, RLS policies mungkin terlalu ketat

**Jika RLS error, periksa policies:**

```
Menu: Authentication → Policies
Pastikan ada:
- Users can view own stores
- Users can view own products
- Users can view own categories
```

## 🚀 Testing di App

Setelah verifikasi Supabase:

1. **Buka Browser Console** (F12)
2. **Login ke aplikasi**
3. **Cek Console Logs:**
   - Cari: `📦 Fetching store for user: <USER_ID>`
   - Cari: `✅ Loaded X products`
   - Cari: `✅ Loaded X categories`

### Jika masih error:

```
❌ Error: invalid input syntax for type uuid: "dummy-store-1"
```

Kemungkinan penyebabnya:

1. isDummyMode masih `true` → Sudah diperbaiki ✓
2. Store belum ter-load dengan benar → Periksa #2 di atas
3. user_id di Auth tidak sesuai dengan store → Periksa #2 di atas
4. RLS policies terlalu ketat → Periksa #4 di atas

## 📊 Query Debugging Lengkap

Jalankan query berikut di Supabase SQL Editor untuk debugging:

```sql
-- 1. Check authenticated user
SELECT auth.uid() as current_user_id;

-- 2. Check stores for current user
SELECT id, user_id, name, is_active
FROM stores
WHERE user_id = auth.uid();

-- 3. Check products for current user's store
SELECT p.id, p.store_id, p.name, p.is_active
FROM products p
JOIN stores s ON s.id = p.store_id
WHERE s.user_id = auth.uid()
LIMIT 30;

-- 4. Check categories for current user's store
SELECT c.id, c.store_id, c.name
FROM categories c
JOIN stores s ON s.id = c.store_id
WHERE s.user_id = auth.uid();
```

## ✅ Konfigurasi Sudah Benar Di Aplikasi

- `useStore.ts` - Ambil store dari Supabase sesuai user login ✓
- `useProducts.ts` - Ambil produk dari Supabase sesuai store_id ✓
- `useCategories.ts` - Ambil kategori dari Supabase sesuai store_id ✓
- `useTransactions.ts` - Simpan transaksi ke Supabase ✓
- `auth.global.ts` - Middleware memastikan store ter-load ✓

Tidak ada perubahan kode lagi yang diperlukan di aplikasi. Masalah pasti di data Supabase yang tidak sesuai!
