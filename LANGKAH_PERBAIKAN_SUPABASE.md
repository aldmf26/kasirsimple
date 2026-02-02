# 🔧 Langkah-Langkah Memperbaiki Sinkronisasi Supabase

## Status Perbaikan ✅

- [x] Dummy Mode dinonaktifkan di `useDummyMode.ts`
- [x] Middleware auth diperbaiki untuk lebih robust store loading
- [ ] **PERLU ANDA LAKUKAN**: Verifikasi data di Supabase

---

## 📋 CHECKLIST - Jalankan di Supabase Dashboard

### Step 1️⃣: Buka Supabase SQL Editor

```
1. Buka Supabase Dashboard → Project Anda
2. Pilih "SQL Editor" di sebelah kiri
3. Klik "New Query"
```

### Step 2️⃣: Cek User Authentication ID

**Jalankan query ini:**

```sql
SELECT auth.uid();
```

- Salin hasilnya (ini adalah USER_ID Anda) - misal: `abc123...`
- **Catat di tempat aman**

### Step 3️⃣: Cek Store di Database

**Jalankan query ini:**

```sql
SELECT id, name, user_id, is_active FROM stores;
```

**Apa yang harus Anda lihat:**

```
id           | name       | user_id | is_active
-------------|------------|---------|----------
uuid-xxxxxx  | aldi store | abc123  | true
```

**PENTING**: `user_id` harus SESUAI dengan hasil Step 2️⃣

**Jika user_id salah atau NULL:**

```sql
-- Jalankan ini, ganti <USER_ID> dengan hasil dari Step 2️⃣
UPDATE stores
SET user_id = '<USER_ID>'
WHERE name = 'aldi store';
```

Contoh:

```sql
UPDATE stores
SET user_id = 'abc123def456...'
WHERE name = 'aldi store';
```

### Step 4️⃣: Catat Store ID

Dari hasil Step 3️⃣, catat ID store "aldi store" - misal: `store-uuid-123`

### Step 5️⃣: Cek Products

**Jalankan query ini (ganti <STORE_ID> dengan hasil Step 4️⃣):**

```sql
SELECT COUNT(*) FROM products WHERE store_id = '<STORE_ID>';
```

**Apa yang harus Anda lihat:**

```
count
-----
30
```

**Jika hasilnya 0 atau error:**

```sql
-- Lihat store_id mana yang ada di products table
SELECT DISTINCT store_id FROM products LIMIT 5;

-- Atau perbaiki langsung dengan meng-update semua produk
-- Ganti <STORE_ID> dengan hasil Step 4️⃣
UPDATE products
SET store_id = '<STORE_ID>'
WHERE store_id IS NULL;
```

### Step 6️⃣: Aktifkan Semua Data yang Inactive

**Jalankan queries ini:**

```sql
-- Aktifkan store
UPDATE stores SET is_active = true WHERE name = 'aldi store';

-- Aktifkan kategori
UPDATE categories SET is_active = true
WHERE store_id = (SELECT id FROM stores WHERE name = 'aldi store');

-- Aktifkan produk
UPDATE products SET is_active = true
WHERE store_id = (SELECT id FROM stores WHERE name = 'aldi store');
```

### Step 7️⃣: Verifikasi RLS Policies

**Jalankan query ini:**

```sql
SELECT * FROM stores;
```

**Apa yang harus Anda lihat:**

- Jika return data → RLS OK ✅
- Jika error `new row violates row-level security policy` → Ada masalah RLS ❌

**Jika ada masalah RLS:**
Buka file [RLS_TROUBLESHOOTING.md](../RLS_TROUBLESHOOTING.md) di workspace

---

## 🚀 Testing di Aplikasi

Setelah selesai dengan Supabase:

### Step 1: Clear Browser Cache

```
1. Buka aplikasi di browser
2. Tekan F12 untuk buka Developer Tools
3. Klik kanan di refresh button → "Empty cache and hard refresh"
```

### Step 2: Login Ulang

```
1. Logout dari aplikasi (jika sudah login)
2. Login kembali dengan credential Anda
```

### Step 3: Buka Browser Console

```
1. Tekan F12
2. Pilih tab "Console"
3. Cari logs berikut:
   - "📦 Fetching store for user: abc123..."
   - "✅ Loaded X products"
   - "✅ Loaded X categories"
```

### Step 4: Buka POS Page

```
1. Navigasi ke /pos
2. Seharusnya muncul:
   - Kategori produk di sidebar
   - 30 produk di grid
   - Tidak ada error di console
```

---

## ❌ Troubleshooting

### Masalah: Masih error "invalid input syntax for type uuid"

**Solusi:**

1. Pastikan Step 3️⃣ sudah benar (user_id sesuai)
2. Restart aplikasi dengan `npm run dev`
3. Clear semua cache browser (Ctrl+Shift+Delete)
4. Logout dan login ulang

### Masalah: Produk tidak muncul di POS

**Solusi:**

1. Jalankan Step 5️⃣ untuk memastikan store_id benar
2. Jalankan Step 6️⃣ untuk aktifkan is_active
3. Check browser console untuk error messages
4. Buka tab "Network" di DevTools, refresh halaman, lihat apakah ada error di Supabase API calls

### Masalah: Login berhasil tapi redirect ke setup

**Solusi:**

1. Berarti tidak ada store untuk user ini
2. Jalankan Step 3️⃣ untuk pastikan store ada dan user_id sesuai

---

## 📞 Jika Masih Stuck

Jalankan query ini dan share hasilnya:

```sql
-- Query debugging lengkap
SELECT
  'Current User' as info,
  auth.uid()::text as value
UNION ALL
SELECT 'Store Count', COUNT(*)::text FROM stores
UNION ALL
SELECT 'Store Name', name FROM stores LIMIT 1
UNION ALL
SELECT 'Products Count', COUNT(*)::text FROM products
UNION ALL
SELECT 'Store-User Match',
  CASE WHEN EXISTS(
    SELECT 1 FROM stores WHERE user_id = auth.uid()
  ) THEN 'YES ✅' ELSE 'NO ❌' END
;
```

Share hasilnya dan kami bisa debug lebih lanjut!
