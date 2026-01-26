# 🛒 Kasir Simple - Sistem POS Modern

> Sistem Point of Sale (POS) yang sederhana, modern, dan flexible untuk berbagai jenis usaha kecil menengah. Didesain khusus untuk pemilik usaha yang tidak tech-savvy namun membutuhkan solusi digital yang praktis.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82.svg)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)

---

## 📖 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Konsep & Arsitektur](#-konsep--arsitektur)
- [Database Schema](#-database-schema-detail)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [User Flow](#-user-flow)
- [API & Composables](#-api--composables)
- [Deployment](#-deployment)
- [Development Guide](#-development-guide)
- [FAQ](#-faq)

---

## 🎯 Tentang Aplikasi

### Problem yang Diselesaikan

**Target User:** Ibu-ibu pemilik usaha kecil (toko kosmetik, laundry, barbershop, cafe, dll) yang:
- ❌ Masih hitung manual → rentan salah
- ❌ Tidak tech-savvy → butuh interface super simple
- ❌ Tidak punya budget besar → butuh solusi affordable
- ❌ Pakai HP lebih sering daripada komputer → butuh mobile-first

### Solusi yang Ditawarkan

✅ **Interface Sederhana** - Design minimal, font besar, tombol besar untuk touchscreen
✅ **Flexible** - Bisa untuk retail (produk + stok), jasa (tanpa stok), atau FnB
✅ **Cloud-based** - Data aman di Supabase, bisa akses dari mana saja
✅ **Mobile-First** - Responsive di HP, tablet, dan desktop
✅ **Gratis** - Menggunakan free tier Supabase & Vercel
✅ **Print & Share** - Struk bisa print thermal, WhatsApp, atau download PDF

---

## ✨ Fitur Utama

### 1. 🔐 Authentication & Multi-Store
- Register/Login dengan email
- 1 akun bisa kelola multiple toko (future-proof)
- Row Level Security (RLS) - setiap user hanya akses data tokonya

### 2. ⚙️ Setup Toko
- **First-time Setup**: Wizard untuk setup toko pertama kali
- **Business Type Selection**: 
  - 🏪 Retail (toko dengan stok)
  - ⚙️ Service/Jasa (tanpa stok)
  - 🍽️ FnB/Resto/Cafe
- Upload logo toko
- Info kontak (alamat, telpon)

### 3. 📦 Manajemen Produk/Jasa
- **CRUD Operations**: Create, Read, Update, Delete (soft delete)
- **Kategori**: Organize produk dengan kategori + warna label
- **SKU**: Kode produk (optional)
- **Harga**: Harga jual + harga modal (untuk profit calculation)
- **Stok Management**: 
  - Auto-tracking stok (untuk produk)
  - Alert stok menipis
  - History perubahan stok
  - Manual adjustment stok
- **Type Flexibility**:
  - Product (dengan stok) → untuk retail
  - Service (tanpa stok) → untuk jasa
- **Search & Filter**: Cari produk by nama/SKU, filter by kategori

### 4. 💳 POS/Kasir Interface
- **Product Selection**: 
  - Grid view dengan foto produk
  - Search bar untuk cari cepat
  - Filter by kategori
- **Cart Management**:
  - Add/remove items
  - Adjust quantity
  - Real-time price calculation
- **Payment Processing**:
  - Multiple payment methods (cash, transfer, QRIS, debit, credit)
  - Auto-calculate kembalian
  - Diskon (nominal atau persen)
  - Customer info (optional)
- **Transaction**: 
  - Auto-generate transaction number (TRX-YYYYMMDD-XXX)
  - Auto-update stok
  - Log semua perubahan

### 5. 🖨️ Print & Share Struk
- **Thermal Printer**: Support 58mm dan 80mm paper
- **WhatsApp Share**: Share struk langsung via WA link
- **Download PDF**: Download struk untuk archive
- **Customizable**:
  - Include/exclude logo
  - Custom footer text
  - Auto-print setelah transaksi (optional)

### 6. 📊 Dashboard & Reports
- **Today's Summary**:
  - Total penjualan hari ini
  - Jumlah transaksi
  - Produk terlaris
  - Alert stok menipis
- **Sales Reports**:
  - Daily/Monthly sales
  - Sales by category
  - Sales by product
  - Payment method breakdown
- **Visual Charts**: Grafik penjualan (coming soon)

### 7. 📱 Responsive & PWA-Ready
- Mobile-first design
- Installable as PWA (Progressive Web App)
- Offline-capable (future)
- Touch-friendly interface

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Nuxt 3](https://nuxt.com/) - Vue 3 framework dengan SSR/SSG
- **UI Library**: [Nuxt UI](https://ui.nuxt.com/) - Tailwind CSS + Headless UI components
- **State Management**: Vue 3 Composition API + Composables
- **Icons**: Heroicons & Lucide via Iconify
- **Utilities**: VueUse - Collection of Vue composition utilities

### Backend & Database
- **BaaS**: [Supabase](https://supabase.com/) - Backend as a Service
  - **Database**: PostgreSQL (relational database)
  - **Auth**: Supabase Auth (email/password, social login ready)
  - **Storage**: Supabase Storage (untuk logo & foto produk)
  - **Realtime**: Supabase Realtime (untuk future features)
  - **RLS**: Row Level Security (data isolation per user)

### Additional Libraries
- **PDF Generation**: jsPDF - Generate PDF struk
- **HTML to Canvas**: html2canvas - Convert HTML to image for print
- **Date/Time**: Native JavaScript Date API
- **Currency Format**: Custom utility functions

### Development Tools
- **TypeScript**: Type safety & better DX
- **ESLint**: Code linting
- **Prettier**: Code formatting (optional)

### Deployment
- **Frontend Hosting**: [Vercel](https://vercel.com/) - Automatic deployments
- **Database Hosting**: Supabase Cloud (PostgreSQL)
- **CDN**: Vercel Edge Network

---

## 🏗️ Konsep & Arsitektur

### Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────┐
│                  USER INTERFACE                      │
│         (Nuxt 3 + Nuxt UI + Tailwind CSS)           │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Dashboard│  │   POS    │  │ Products │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Reports  │  │ Settings │  │  Auth    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Supabase Client
                     │ (REST API / Realtime)
                     │
┌────────────────────▼────────────────────────────────┐
│              SUPABASE (Backend)                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐           │  │
│  │  │ Stores │ │Products│ │Transac-│           │  │
│  │  │        │ │        │ │ tions  │           │  │
│  │  └────────┘ └────────┘ └────────┘           │  │
│  │         + 5 other tables                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Authentication (Auth)                 │  │
│  │  - Email/Password                             │  │
│  │  - Social Login (future)                      │  │
│  │  - Session Management                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         Storage (File Upload)                 │  │
│  │  - Logo Toko                                  │  │
│  │  - Foto Produk                                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │    Row Level Security (RLS Policies)          │  │
│  │  - User hanya akses data toko sendiri         │  │
│  │  - Automatic data isolation                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     │
                     │ Deploy
                     ▼
┌─────────────────────────────────────────────────────┐
│              VERCEL (Production)                     │
│  - Static Site Generation (SSG)                      │
│  - Edge Functions                                    │
│  - CDN Global                                        │
│  - Auto HTTPS                                        │
└─────────────────────────────────────────────────────┘
```

### Data Flow - Contoh Transaksi

```
1. User klik "Buka Kasir"
   └─> pages/pos/index.vue

2. User pilih produk
   └─> components/pos/ProductGrid.vue
       └─> composables/useProducts.ts
           └─> Supabase: SELECT * FROM products WHERE store_id = ...

3. Add to cart
   └─> Local state (reactive cart object)
       └─> Calculate subtotal, total, etc

4. User klik "Bayar"
   └─> components/pos/Payment.vue
       └─> Validate input (paid >= total)

5. Process payment
   └─> composables/useTransactions.ts
       └─> Supabase Transaction (BEGIN):
           ├─> INSERT transaction (header)
           ├─> INSERT transaction_items (detail)
           ├─> UPDATE products SET stock = stock - qty (jika ada stok)
           └─> INSERT stock_movements (log perubahan stok)
       └─> Supabase Transaction (COMMIT)

6. Generate & print struk
   └─> utils/receipt.ts
       ├─> Generate HTML struk
       ├─> Print via browser API (thermal)
       ├─> Generate PDF (jsPDF)
       └─> Generate WA link with text struk
```

---

## 🗄️ Database Schema (Detail)

### Overview

Database menggunakan **PostgreSQL** dengan **8 tables utama** + **3 views** untuk reporting.

### Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   users     │ (Supabase Auth - built-in)
│ id (PK)     │
│ email       │
│ created_at  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────────┐
│   stores            │ (Toko)
│ id (PK)             │
│ user_id (FK)        │◄────────┐
│ name                │         │
│ business_type       │         │ Referenced by
│ address             │         │ all tables
│ phone               │         │
│ logo_url            │         │
│ currency            │         │
└──────┬──────────────┘         │
       │ 1                      │
       │                        │
       │ N                      │
┌──────▼──────────────┐         │
│  categories         │         │
│ id (PK)             │         │
│ store_id (FK) ──────┼─────────┤
│ name                │         │
│ color               │         │
│ icon                │         │
│ sort_order          │         │
└──────┬──────────────┘         │
       │ 1                      │
       │                        │
       │ N                      │
┌──────▼──────────────┐         │
│   products          │         │
│ id (PK)             │         │
│ store_id (FK) ──────┼─────────┤
│ category_id (FK)    │         │
│ name                │         │
│ sku                 │         │
│ price               │         │
│ cost                │         │
│ type                │         │ (product/service)
│ has_stock           │         │
│ stock               │         │
│ min_stock           │         │
│ image_url           │         │
└──────┬──────────────┘         │
       │                        │
       │ Referenced by          │
       │                        │
┌──────▼──────────────┐         │
│ stock_movements     │         │
│ id (PK)             │         │
│ product_id (FK)     │         │
│ transaction_id (FK) │         │
│ type                │         │ (in/out/adjustment)
│ quantity            │         │
│ stock_before        │         │
│ stock_after         │         │
│ notes               │         │
└─────────────────────┘         │
                                │
┌─────────────────────┐         │
│  transactions       │         │
│ id (PK)             │         │
│ store_id (FK) ──────┼─────────┤
│ transaction_number  │         │
│ subtotal            │         │
│ discount            │         │
│ discount_type       │         │
│ tax                 │         │
│ total               │         │
│ paid                │         │
│ change              │         │
│ payment_method      │         │
│ customer_name       │         │
│ customer_phone      │         │
└──────┬──────────────┘         │
       │ 1                      │
       │                        │
       │ N                      │
┌──────▼──────────────┐         │
│ transaction_items   │         │
│ id (PK)             │         │
│ transaction_id (FK) │         │
│ product_id (FK)     │         │ (nullable - snapshot)
│ product_name        │         │ (snapshot saat transaksi)
│ product_sku         │         │
│ product_price       │         │
│ quantity            │         │
│ subtotal            │         │
└─────────────────────┘         │
                                │
┌─────────────────────┐         │
│ printer_settings    │         │
│ id (PK)             │         │
│ store_id (FK) ──────┼─────────┘
│ printer_type        │
│ paper_width         │
│ auto_print          │
│ include_logo        │
│ footer_text         │
└─────────────────────┘
```

### Table Details

#### 1. `stores` - Master Data Toko

```sql
CREATE TABLE stores (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),  -- Pemilik toko
    name TEXT NOT NULL,                       -- Nama toko
    business_type TEXT,                       -- retail/service/fnb
    address TEXT,                             -- Alamat toko
    phone TEXT,                               -- Nomor telepon
    logo_url TEXT,                            -- URL logo (Supabase Storage)
    currency TEXT DEFAULT 'Rp',               -- Mata uang
    timezone TEXT DEFAULT 'Asia/Jakarta',     -- Timezone
    is_active BOOLEAN DEFAULT true,           -- Status aktif
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Purpose**: Menyimpan informasi toko. 1 user bisa punya multiple stores (future-proof).

**Indexes**: 
- `user_id` - untuk query cepat "tampilkan semua toko user ini"
- `is_active` - filter toko aktif

---

#### 2. `categories` - Kategori Produk/Jasa

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),      -- Toko mana
    name TEXT NOT NULL,                       -- Nama kategori
    description TEXT,                         -- Deskripsi
    color TEXT DEFAULT '#3B82F6',             -- Warna label (hex)
    icon TEXT,                                -- Emoji atau icon name
    sort_order INTEGER DEFAULT 0,             -- Urutan tampilan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(store_id, name)                    -- Nama kategori unique per toko
);
```

**Purpose**: Organize produk ke dalam kategori. Contoh: Skincare, Makeup, Haircare.

**Use Case**:
- Filter produk by kategori di POS
- Report penjualan by kategori
- Warna untuk visual labeling

---

#### 3. `products` - Produk/Jasa

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    category_id UUID REFERENCES categories(id),
    sku TEXT,                                 -- Kode produk (optional)
    name TEXT NOT NULL,                       -- Nama produk
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,            -- Harga jual
    cost NUMERIC(12, 2),                      -- Harga modal
    type TEXT DEFAULT 'product',              -- product/service
    has_stock BOOLEAN DEFAULT true,           -- Track stok atau tidak
    stock INTEGER DEFAULT 0,                  -- Stok saat ini
    min_stock INTEGER DEFAULT 5,              -- Minimum stok (alert)
    image_url TEXT,                           -- Foto produk
    is_active BOOLEAN DEFAULT true,           -- Soft delete
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Purpose**: Master data produk/jasa yang dijual.

**Key Features**:
- **Flexible Type**: 
  - `type='product'` + `has_stock=true` → Produk fisik (retail)
  - `type='service'` + `has_stock=false` → Jasa/layanan
- **Price vs Cost**: 
  - `price` = harga jual
  - `cost` = harga modal
  - `profit = price - cost`
- **Stock Alert**: Jika `stock <= min_stock`, tampilkan alert
- **Soft Delete**: `is_active=false` untuk "hapus" tanpa hilangkan data

**Indexes**:
- `store_id` - query produk per toko
- `category_id` - filter by kategori
- `sku` - search by SKU
- `name` - full-text search (GIN index)

---

#### 4. `transactions` - Header Transaksi

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    transaction_number TEXT UNIQUE,           -- TRX-20250126-001
    subtotal NUMERIC(12, 2),                  -- Total sebelum diskon
    discount NUMERIC(12, 2) DEFAULT 0,        -- Diskon
    discount_type TEXT DEFAULT 'nominal',     -- nominal/percent
    tax NUMERIC(12, 2) DEFAULT 0,             -- Pajak
    total NUMERIC(12, 2),                     -- Grand total
    paid NUMERIC(12, 2),                      -- Uang yang dibayar
    change NUMERIC(12, 2),                    -- Kembalian
    payment_method TEXT DEFAULT 'cash',       -- cash/transfer/qris/etc
    customer_name TEXT,                       -- Nama customer (optional)
    customer_phone TEXT,                      -- Telp customer (optional)
    notes TEXT,                               -- Catatan
    created_by UUID REFERENCES auth.users(id), -- Kasir yang input
    created_at TIMESTAMPTZ
);
```

**Purpose**: Header transaksi penjualan (1 struk = 1 row).

**Transaction Number Format**: `TRX-YYYYMMDD-XXX`
- `TRX` = prefix
- `20250126` = tanggal (YYYYMMDD)
- `001` = sequence number (reset setiap hari)
- Contoh: `TRX-20250126-001`, `TRX-20250126-002`, ...

**Calculation Flow**:
```
subtotal = SUM(item.price * item.quantity)
discount = (discount_type === 'percent') 
           ? subtotal * (discount / 100) 
           : discount
total = subtotal - discount + tax
change = paid - total
```

**Indexes**:
- `transaction_number` - unique, untuk search
- `created_at` - untuk filter by date range
- `store_id` - query transaksi per toko

---

#### 5. `transaction_items` - Detail Transaksi

```sql
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id),
    product_id UUID REFERENCES products(id),  -- Reference (bisa null)
    product_name TEXT NOT NULL,               -- SNAPSHOT
    product_sku TEXT,                         -- SNAPSHOT
    product_price NUMERIC(12, 2),             -- SNAPSHOT
    quantity INTEGER NOT NULL,
    subtotal NUMERIC(12, 2),                  -- price * quantity
    notes TEXT,
    created_at TIMESTAMPTZ
);
```

**Purpose**: Detail item yang dibeli dalam 1 transaksi.

**Why Snapshot?**
- `product_id` adalah reference (bisa null jika produk dihapus)
- `product_name`, `product_sku`, `product_price` adalah **snapshot** (copy data saat transaksi)
- **Alasan**: Jika nanti produk dihapus atau harga berubah, history transaksi tetap akurat

**Example**:
```
Transaction TRX-20250126-001:
- Item 1: Wardah Serum, Rp 75.000, Qty 2 = Rp 150.000
- Item 2: Emina Face Wash, Rp 25.000, Qty 1 = Rp 25.000
Subtotal: Rp 175.000
Discount: Rp 10.000
Total: Rp 165.000
```

---

#### 6. `stock_movements` - Riwayat Perubahan Stok

```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    transaction_id UUID REFERENCES transactions(id), -- Null jika adjustment
    type TEXT NOT NULL,                              -- in/out/adjustment
    quantity INTEGER,                                -- +/- perubahan
    stock_before INTEGER,                            -- Stok sebelum
    stock_after INTEGER,                             -- Stok sesudah
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ
);
```

**Purpose**: Audit trail perubahan stok.

**Types**:
- `in` = Stok masuk (restock, purchase)
- `out` = Stok keluar (penjualan)
- `adjustment` = Koreksi manual (stok opname)

**Example**:
```
Product: Wardah Serum
- Stock before: 50
- Transaction: Jual 2 pcs
- Stock after: 48
- Type: out
- Quantity: -2
- Reference: TRX-20250126-001
```

**Use Case**:
- History stok produk
- Audit "kenapa stok berkurang?"
- Report stok masuk/keluar

---

#### 7. `printer_settings` - Pengaturan Printer

```sql
CREATE TABLE printer_settings (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    printer_type TEXT DEFAULT 'thermal',      -- thermal/a4/none
    paper_width INTEGER DEFAULT 58,           -- 58mm atau 80mm
    auto_print BOOLEAN DEFAULT false,         -- Print otomatis
    include_logo BOOLEAN DEFAULT true,        -- Tampilkan logo
    include_store_info BOOLEAN DEFAULT true,  -- Tampilkan info toko
    footer_text TEXT,                         -- Custom footer
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(store_id)                          -- 1 toko = 1 setting
);
```

**Purpose**: Pengaturan print struk per toko.

**Use Case**:
- Customize tampilan struk
- Auto-print setelah transaksi
- Footer custom ("Terima kasih", "Barang tidak dapat dikembalikan", dll)

---

### Views untuk Reporting

#### 1. `daily_sales_summary`

```sql
CREATE VIEW daily_sales_summary AS
SELECT 
    store_id,
    DATE(created_at) as sale_date,
    COUNT(*) as total_transactions,
    SUM(total) as total_sales,
    AVG(total) as average_transaction,
    SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_sales,
    SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END) as non_cash_sales
FROM transactions
GROUP BY store_id, DATE(created_at);
```

**Purpose**: Summary penjualan per hari.

**Use Case**: Dashboard "Penjualan Hari Ini"

---

#### 2. `product_sales_summary`

```sql
CREATE VIEW product_sales_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    COUNT(ti.id) as times_sold,
    SUM(ti.quantity) as total_quantity_sold,
    SUM(ti.subtotal) as total_revenue
FROM products p
LEFT JOIN transaction_items ti ON ti.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.name, c.name;
```

**Purpose**: Summary penjualan per produk.

**Use Case**: Report "Produk Terlaris"

---

#### 3. `low_stock_products`

```sql
CREATE VIEW low_stock_products AS
SELECT 
    id,
    store_id,
    name,
    sku,
    stock,
    min_stock,
    (min_stock - stock) as shortage
FROM products
WHERE has_stock = true
  AND is_active = true
  AND stock <= min_stock
ORDER BY shortage DESC;
```

**Purpose**: Daftar produk yang stoknya menipis.

**Use Case**: Dashboard alert "Stok Menipis"

---

### Database Functions

#### 1. `generate_transaction_number(store_id)`

```sql
-- Auto-generate nomor transaksi: TRX-20250126-001
```

**Logic**:
1. Get today's date → `20250126`
2. Find last transaction number today → `TRX-20250126-005`
3. Increment sequence → `006`
4. Return → `TRX-20250126-006`

---

#### 2. `update_product_stock(product_id, quantity, type, ...)`

```sql
-- Update stok produk + log ke stock_movements
```

**Logic**:
1. Get current stock
2. Calculate new stock based on type (in/out/adjustment)
3. Update products table
4. Insert log ke stock_movements
5. Return success/fail

---

### Row Level Security (RLS)

**Konsep**: Setiap user hanya bisa akses data toko miliknya sendiri.

**Implementasi**:
```sql
-- Example policy untuk table products
CREATE POLICY "Users can view own products"
ON products FOR SELECT
USING (
    store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);
```

**Artinya**: 
- `auth.uid()` = ID user yang sedang login (dari Supabase Auth)
- User hanya bisa SELECT products yang `store_id` nya ada di toko milik dia

**Benefit**:
- Data isolation otomatis
- Tidak perlu manual filter `WHERE store_id = ...` di setiap query
- Security by default

---

## 📥 Installation

### Prerequisites

Pastikan sudah terinstall:
- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **npm** >= 9.x atau **pnpm** (recommended) atau **yarn**
- **Git** ([Download](https://git-scm.com/))
- **Akun Supabase** (gratis) ([Sign up](https://supabase.com/))
- **Akun Vercel** (gratis, optional untuk deploy) ([Sign up](https://vercel.com/))

### Step 1: Clone/Create Project

```bash
# Option A: Clone repository (jika sudah ada repo)
git clone <repository-url>
cd kasir-simple

# Option B: Create new Nuxt project
npx nuxi@latest init kasir-simple
cd kasir-simple
```

### Step 2: Install Dependencies

```bash
# Menggunakan pnpm (recommended - faster)
pnpm install

# Atau menggunakan npm
npm install

#