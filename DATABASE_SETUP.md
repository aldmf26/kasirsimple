# Database Setup Guide - Kasir Simple

## 📋 Overview

Aplikasi POS **Kasir Simple** menggunakan **Supabase** sebagai backend database dengan **Row Level Security (RLS)** untuk keamanan data multi-tenant.

## 🏗️ Schema Overview

### Tables

#### 1. **stores** - Toko User

Menyimpan informasi profil toko untuk setiap pengguna.

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → auth.users)
- name (TEXT) - Nama toko
- business_type (TEXT) - retail/service/fnb
- address (TEXT) - Alamat toko
- phone (TEXT) - Nomor telepon
- logo_url (TEXT) - URL logo
- currency (TEXT) - Mata uang default (Rp)
- timezone (TEXT) - Zona waktu
- is_active (BOOLEAN) - Status toko
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. **categories** - Kategori Produk

Kategori untuk mengelompokkan produk.

```sql
- id (UUID, Primary Key)
- store_id (UUID, Foreign Key → stores)
- name (TEXT) - Nama kategori
- description (TEXT)
- color (TEXT) - Warna badge (#HEX)
- icon (TEXT)
- sort_order (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(store_id, name)
```

#### 3. **products** - Produk/Barang

Daftar produk yang dijual di toko.

```sql
- id (UUID, Primary Key)
- store_id (UUID, Foreign Key → stores)
- category_id (UUID, Foreign Key → categories)
- sku (TEXT)
- name (TEXT) - Nama produk
- description (TEXT)
- price (NUMERIC) - Harga jual
- buy_price (NUMERIC) - Harga beli (untuk tracking profit)
- type (TEXT) - product/service
- unit (TEXT) - Satuan (pcs, kg, dll)
- has_stock (BOOLEAN) - Tracking stok?
- stock (INTEGER) - Jumlah stok
- min_stock (INTEGER) - Stok minimal
- image_url (TEXT) - Foto produk
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 4. **transactions** - Transaksi Penjualan

Menyimpan setiap transaksi/penjualan.

```sql
- id (UUID, Primary Key)
- store_id (UUID, Foreign Key → stores)
- transaction_number (TEXT) - Format: TRX-YYYYMMDD-###
- subtotal (NUMERIC) - Subtotal sebelum diskon
- discount (NUMERIC) - Jumlah diskon
- discount_type (TEXT) - nominal/percent
- total (NUMERIC) - Total yang dibayar
- paid (NUMERIC) - Uang yang diterima
- change (NUMERIC) - Kembalian
- payment_method (TEXT) - cash/transfer/qris/dll
- customer_name (TEXT)
- customer_phone (TEXT)
- notes (TEXT)
- created_by (UUID) - User yang membuat transaksi
- created_at (TIMESTAMPTZ)
- UNIQUE(store_id, transaction_number)
```

#### 5. **transaction_items** - Item Detail Transaksi

Detail produk dalam setiap transaksi.

```sql
- id (UUID, Primary Key)
- transaction_id (UUID, Foreign Key → transactions)
- product_id (UUID, Foreign Key → products)
- product_name (TEXT) - Snapshot nama
- product_sku (TEXT) - Snapshot SKU
- product_price (NUMERIC) - Snapshot harga saat transaksi
- quantity (INTEGER) - Jumlah beli
- subtotal (NUMERIC) - Harga × Qty
- notes (TEXT)
- created_at (TIMESTAMPTZ)
```

#### 6. **stock_movements** - Log Pergerakan Stok

Audit trail untuk setiap perubahan stok.

```sql
- id (UUID, Primary Key)
- product_id (UUID, Foreign Key → products)
- transaction_id (UUID, Foreign Key → transactions)
- type (TEXT) - in/out/adjustment
- quantity (INTEGER)
- stock_before (INTEGER)
- stock_after (INTEGER)
- notes (TEXT)
- created_by (UUID)
- created_at (TIMESTAMPTZ)
```

#### 7. **printer_settings** - Pengaturan Printer

Konfigurasi printer struk untuk setiap toko.

```sql
- id (UUID, Primary Key)
- store_id (UUID, UNIQUE, Foreign Key → stores)
- printer_type (TEXT) - thermal/none
- paper_width (INTEGER) - 58/80
- auto_print (BOOLEAN)
- include_logo (BOOLEAN)
- include_store_info (BOOLEAN)
- footer_text (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### Views

#### 1. **daily_sales_summary**

Ringkasan penjualan harian per toko.

```sql
SELECT
  store_id,
  sale_date,
  total_transactions,
  total_sales,
  cash_sales,
  non_cash_sales,
  average_transaction
```

#### 2. **product_sales_summary**

Ringkasan penjualan per produk.

```sql
SELECT
  product_id,
  product_name,
  times_sold,
  total_quantity_sold,
  total_revenue
```

#### 3. **low_stock_products**

Produk dengan stok dibawah minimum.

```sql
SELECT
  id, name, stock, min_stock, shortage
WHERE stock <= min_stock
```

## 🔒 Row Level Security (RLS)

Setiap table memiliki RLS policies untuk memastikan user hanya bisa mengakses data toko mereka.

### RLS Policies

#### **STORES Table**

```sql
-- SELECT: Users can view own stores
SELECT (auth.uid() = user_id)

-- INSERT: Users can create stores
INSERT (auth.uid() = user_id)

-- UPDATE: Users can update own stores
UPDATE (auth.uid() = user_id)

-- DELETE: Users can delete own stores
DELETE (auth.uid() = user_id)
```

#### **CATEGORIES, PRODUCTS, TRANSACTIONS, etc.**

```sql
-- All operations check if store_id belongs to user's stores
store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
```

### Security Flow

```
User Login
    ↓
Get auth.uid() from JWT
    ↓
Query stores WHERE user_id = auth.uid()
    ↓
Get list of user's store_ids
    ↓
Access other tables (products, transactions, etc.)
    ↓
RLS automatically filters to user's store_id only
```

## 🚀 Setup Instructions

### 1. Create Tables

```bash
# Jalankan schema.sql di Supabase SQL Editor
psql -U postgres -d [your-db] -f supabase/schema.sql
```

### 2. Enable RLS

RLS sudah di-enable dalam schema.sql, tapi pastikan dengan:

1. Buka Supabase Dashboard → Authentication → Policies
2. Verify bahwa semua policies sudah created
3. Check bahwa "Enable RLS" toggle ON untuk setiap table

### 3. Run Migrations (Optional)

```bash
# Migration untuk tambahan columns
psql -U postgres -d [your-db] -f supabase/migrations/002_add_buy_price_unit.sql
```

## 🔑 Environment Variables

Pastikan `.env.local` memiliki:

```env
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # (Backend only)
```

## 📊 Data Model Relationships

```
auth.users (from Supabase Auth)
    ↓ (1:1)
    stores
    ├── 1:N → categories
    ├── 1:N → products (via store_id)
    │   └── 1:N → transaction_items (via product_id)
    │       └── N:1 → transactions (via transaction_id)
    ├── 1:N → transactions (via store_id)
    │   ├── 1:N → transaction_items
    │   └── 1:N → stock_movements (via transaction_id)
    ├── 1:N → stock_movements (via product_id → products → store_id)
    └── 1:1 → printer_settings
```

## 🔍 Query Examples

### Get User's Store

```typescript
const { data } = await supabase
  .from("stores")
  .select("*")
  .eq("user_id", auth.uid())
  .maybeSingle();
```

### Get Products (Auto-filtered by RLS)

```typescript
const { data } = await supabase
  .from("products")
  .select("*, category:categories(*)")
  .eq("store_id", storeId); // RLS ensures storeId belongs to user
```

### Get Today's Sales Summary

```typescript
const { data } = await supabase
  .from("daily_sales_summary")
  .select("*")
  .eq("store_id", storeId)
  .eq("sale_date", new Date().toISOString().split("T")[0]);
```

### Get Low Stock Products

```typescript
const { data } = await supabase
  .from("low_stock_products")
  .select("*")
  .eq("store_id", storeId);
```

## 🛡️ Security Best Practices

1. **RLS Always On** - Jangan disable RLS di production
2. **Use Service Role Carefully** - Hanya di server-side operations
3. **Validate Input** - Client-side validation + server-side
4. **Audit Trail** - stock_movements table mencatat semua perubahan
5. **Transaction Uniqueness** - transaction_number UNIQUE per store
6. **Soft Deletes** - Produk/kategori di-soft delete via is_active flag

## 🐛 Troubleshooting

### RLS Error: "select policy with check expression (false)"

**Solution**: Ensure RLS policies are created before testing

### Can't Access Data

**Solution**: Check RLS policy - user_id must match auth.uid()

### Duplicate Transaction Numbers

**Solution**: Use generateTransactionNumber() in useTransactions composable

### Stock Goes Negative

**Solution**: Check stock availability before adding to cart

## 📝 Notes

- Semua timestamps dalam UTC (TIMESTAMPTZ)
- `buy_price` untuk tracking profit margin
- `unit` field untuk diversity produk (pcs, kg, liter, etc.)
- Soft deletes untuk data integrity (historical tracking)
- Stock movements untuk audit complete
