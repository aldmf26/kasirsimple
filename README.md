<p align="center">
  <h1 align="center">💰 KasirOK</h1>
  <p align="center">Aplikasi Kasir (POS) Modern untuk UMKM Indonesia</p>
  <p align="center">
    <img src="https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxtdotjs&logoColor=white" alt="Nuxt 3" />
    <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Nuxt_UI-v3-00DC82?logo=nuxtdotjs&logoColor=white" alt="Nuxt UI" />
    <img src="https://img.shields.io/badge/TypeScript-Typed-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</p>

---

## 📖 Tentang KasirOK

**KasirOK** adalah aplikasi kasir (Point of Sale) berbasis web yang dirancang khusus untuk pelaku UMKM di Indonesia. Cocok digunakan untuk:

- 🏪 **Toko Retail** — toko kelontong, toko baju, dll
- ☕ **Cafe & Kedai Kopi**
- 🍜 **Warung Makan & Resto**
- ✂️ **Barbershop & Salon**
- 👕 **Laundry**
- 🛍️ **Bisnis UMKM lainnya**

Dapat diakses dari **HP, Tablet, maupun Laptop** melalui browser tanpa perlu instalasi.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🛒 **POS (Kasir)** | Antarmuka kasir modern dengan pencarian produk, kategori, keranjang belanja, dan kalkulasi otomatis |
| 📦 **Manajemen Produk** | CRUD produk, kategori, SKU, gambar, satuan (pcs/kg/porsi), tipe produk/jasa, favorit |
| 📊 **Manajemen Stok** | Stok masuk/keluar/adjustment, riwayat pergerakan stok, notifikasi stok menipis |
| 💳 **Multi Pembayaran** | Tunai, QRIS, Kartu Bank — bisa diaktifkan/nonaktifkan sesuai kebutuhan |
| 🧾 **Cetak Struk** | Struk thermal 58mm, bisa dicetak langsung atau preview di layar |
| 📈 **Laporan & Grafik** | Grafik penjualan harian, produk terlaris, metode pembayaran, filter per periode |
| 📤 **Export Data** | Export laporan ke Excel (.xlsx) dan PDF |
| 💾 **Backup Data** | Backup seluruh data (produk, transaksi, stok) dalam format JSON |
| 🏷️ **Diskon & Pajak** | Diskon manual (nominal/persen), diskon otomatis dari pengaturan, pajak & PPN |
| 🏪 **Pengaturan Toko** | Profil toko, logo, alamat, rekening bank, pengaturan printer |
| 📋 **Riwayat Aktivitas** | Log semua aktivitas (tambah produk, transaksi, perubahan stok, dll) |
| 🔐 **Keamanan** | Autentikasi Supabase, Row Level Security (RLS) — data terjamin aman per user |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Framework** | [Nuxt 3](https://nuxt.com/) (Vue 3 + TypeScript) |
| **UI Library** | [Nuxt UI v3](https://ui.nuxt.com/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| **Grafik** | [Chart.js](https://www.chartjs.org/) via vue-chartjs |
| **Export** | SheetJS (Excel), jsPDF + autoTable (PDF) |

---

## 🚀 Cara Menjalankan

### Prasyarat

- [Node.js](https://nodejs.org/) v18+ 
- Akun [Supabase](https://supabase.com/) (gratis)

### 1. Clone & Install

```bash
git clone https://github.com/username/kasirsimple.git
cd kasirsimple
npm install
```

### 2. Konfigurasi Environment

Buat file `.env` di root folder:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

> Dapatkan URL dan Anon Key dari **Supabase Dashboard** → **Settings** → **API**.

### 3. Setup Database Supabase

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy-paste isi file `supabase/schema.sql`
3. Jalankan query tersebut
4. Pastikan semua tabel berhasil dibuat (7 tabel)

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

### 5. Registrasi & Mulai

1. Buka halaman **Register** dan buat akun
2. Isi nama toko, tipe bisnis, dan data lainnya
3. Mulai tambahkan produk dan gunakan POS! 🎉

---

## 📁 Struktur Proyek

```
kasirsimple/
├── app/
│   ├── components/          # Komponen reusable
│   │   ├── AppAlert.vue              # Notifikasi alert global
│   │   └── ThermalPrinterReceipt.vue # Template struk thermal
│   │
│   ├── composables/         # Logic & state management
│   │   ├── useStore.ts               # Manajemen data toko
│   │   ├── useProducts.ts            # CRUD produk & stok
│   │   ├── useCategories.ts          # CRUD kategori
│   │   ├── useTransactions.ts        # Transaksi & keranjang
│   │   ├── useCharts.ts              # Data grafik untuk laporan
│   │   ├── useActivityLog.ts         # Logging aktivitas
│   │   ├── useToastNotification.ts   # Notifikasi toast
│   │   ├── useDummyMode.ts           # Mode demo (tanpa Supabase)
│   │   └── useDummyData.ts           # Data dummy untuk demo
│   │
│   ├── layouts/             # Layout halaman
│   │   ├── default.vue               # Layout utama (dengan sidebar/navbar)
│   │   ├── auth.vue                  # Layout halaman login/register
│   │   └── landing.vue               # Layout landing page
│   │
│   ├── pages/               # Halaman-halaman aplikasi
│   │   ├── index.vue                 # Landing page (marketing)
│   │   ├── dashboard.vue             # Dashboard ringkasan toko
│   │   ├── activity-history.vue      # Riwayat aktivitas
│   │   ├── auth/
│   │   │   ├── login.vue             # Halaman login
│   │   │   ├── register.vue          # Halaman registrasi
│   │   │   ├── forgot-password.vue   # Lupa password
│   │   │   └── update-password.vue   # Update password
│   │   ├── pos/
│   │   │   └── index.vue             # Halaman kasir (POS)
│   │   ├── products/
│   │   │   └── index.vue             # Manajemen produk & kategori
│   │   ├── transactions/
│   │   │   └── index.vue             # Riwayat transaksi
│   │   ├── reports/
│   │   │   └── index.vue             # Laporan & grafik penjualan
│   │   └── settings/
│   │       └── index.vue             # Pengaturan toko
│   │
│   └── utils/
│       ├── helpers.ts                # Utility functions (format currency, dll)
│       └── activityLogger.ts         # Helper logging aktivitas
│
├── supabase/
│   └── schema.sql                    # Database schema lengkap
│
├── nuxt.config.ts                    # Konfigurasi Nuxt
├── package.json
└── .env                              # Environment variables
```

---

## 🗄️ Database Schema

### Diagram Relasi Tabel

```
┌──────────────┐
│  auth.users  │
│──────────────│
│  id (PK)     │
└──────┬───────┘
       │ 1
       │
       ▼ N
┌──────────────────────┐        ┌───────────────────┐
│       stores         │ 1    1 │  printer_settings  │
│──────────────────────│───────▶│───────────────────│
│  id (PK)             │        │  id (PK)          │
│  user_id (FK→users)  │        │  store_id (FK)    │
│  name                │        │  printer_type     │
│  business_type       │        │  paper_width      │
│  address, phone      │        │  auto_print       │
│  logo_url            │        └───────────────────┘
│  currency, timezone  │
│  payment settings... │
│  discount_tax...     │
└──────┬───────────────┘
       │ 1
       │
       ├─────────────────────────┐
       │                         │
       ▼ N                       ▼ N
┌──────────────────┐      ┌────────────────────────┐
│   categories     │      │     transactions        │
│──────────────────│      │────────────────────────│
│  id (PK)         │      │  id (PK)               │
│  store_id (FK)   │      │  store_id (FK)         │
│  name            │      │  transaction_number    │
│  color           │      │  subtotal, total       │
│  sort_order      │      │  discount, tax, ppn    │
└──────┬───────────┘      │  paid, change          │
       │ 1                │  payment_method        │
       │                  │  customer_name/phone   │
       ▼ N                │  created_by (FK→users) │
┌──────────────────┐      └──────┬─────────────────┘
│    products      │             │ 1
│──────────────────│             │
│  id (PK)         │             ├─────────────────┐
│  store_id (FK)   │             │                 │
│  category_id(FK) │             ▼ N               ▼ N
│  name, sku       │      ┌───────────────┐  ┌─────────────────┐
│  price, buy_price│      │ transaction   │  │ stock_movements  │
│  stock, min_stock│      │ _items        │  │─────────────────│
│  type, unit      │      │───────────────│  │  id (PK)        │
│  is_favorite     │      │  id (PK)      │  │  product_id(FK) │
│  image_url       │      │  transaction  │  │  transaction    │
└──────┬───────────┘      │  _id (FK)     │  │  _id (FK)       │
       │                  │  product_id   │  │  type (in/out/  │
       │                  │  (FK)         │  │   adjustment)   │
       │                  │  product_name │  │  quantity        │
       │ 1                │  quantity     │  │  stock_before    │
       │                  │  subtotal     │  │  stock_after     │
       ▼ N                └───────────────┘  └─────────────────┘
┌─────────────────┐
│ stock_movements  │ (juga terhubung dari products)
└─────────────────┘
```

### Daftar Tabel

| # | Tabel | Deskripsi | Rows |
|---|-------|-----------|------|
| 1 | `stores` | Data toko & pengaturan | 1 |
| 2 | `categories` | Kategori produk | 8 |
| 3 | `products` | Daftar produk/jasa | 27 |
| 4 | `transactions` | Header transaksi penjualan | 44 |
| 5 | `transaction_items` | Detail item per transaksi | 51 |
| 6 | `stock_movements` | Riwayat pergerakan stok | 73 |
| 7 | `printer_settings` | Pengaturan printer thermal | 0 |

### Relasi Antar Tabel

| Dari | → | Ke | Tipe |
|------|---|-----|------|
| `stores.user_id` | → | `auth.users.id` | Many-to-One |
| `categories.store_id` | → | `stores.id` | Many-to-One |
| `products.store_id` | → | `stores.id` | Many-to-One |
| `products.category_id` | → | `categories.id` | Many-to-One |
| `transactions.store_id` | → | `stores.id` | Many-to-One |
| `transactions.created_by` | → | `auth.users.id` | Many-to-One |
| `transaction_items.transaction_id` | → | `transactions.id` | Many-to-One |
| `transaction_items.product_id` | → | `products.id` | Many-to-One |
| `stock_movements.product_id` | → | `products.id` | Many-to-One |
| `stock_movements.transaction_id` | → | `transactions.id` | Many-to-One |
| `stock_movements.created_by` | → | `auth.users.id` | Many-to-One |
| `printer_settings.store_id` | → | `stores.id` | One-to-One |

---

## 🔄 Alur Penggunaan Aplikasi

### Alur Setup Awal

```
Register → Login → Buat Toko → Tambah Kategori → Tambah Produk → Siap Jualan!
```

### Alur Transaksi (POS)

```
1. Buka halaman POS (/pos)
2. Pilih produk dari grid → masuk ke Keranjang
3. Atur jumlah barang di keranjang
4. Klik "Bayar" → muncul modal pembayaran
5. Pilih metode bayar (Tunai/QRIS/Kartu)
6. Masukkan jumlah uang bayar
7. Sistem otomatis hitung:
   - Diskon otomatis (dari pengaturan)
   - Pajak & PPN (dari pengaturan)
   - Kembalian
8. Klik "Proses Pembayaran"
9. Stok produk otomatis berkurang
10. Struk bisa dicetak / di-preview
```

### Alur Manajemen Stok

```
1. Buka halaman Produk (/products)
2. Klik ikon stok pada produk
3. Pilih tipe: Stok Masuk / Stok Keluar / Adjustment
4. Masukkan jumlah & catatan
5. Stok terupdate + tercatat di stock_movements
```

### Alur Laporan

```
1. Buka halaman Laporan (/reports)
2. Pilih filter waktu: Hari Ini / Minggu / Bulan / Tahun / Custom
3. Lihat ringkasan: Total Penjualan, Jumlah Transaksi, Rata-rata
4. Lihat grafik: Penjualan Harian, Produk Terlaris, Metode Bayar
5. Export ke Excel atau PDF jika diperlukan
6. Backup seluruh data ke file JSON
```

---

## 📱 Halaman-Halaman

| Halaman | Path | Deskripsi |
|---------|------|-----------|
| Landing Page | `/` | Halaman marketing untuk pengunjung baru |
| Login | `/auth/login` | Masuk ke akun |
| Register | `/auth/register` | Daftar akun baru |
| Lupa Password | `/auth/forgot-password` | Reset password via email |
| **Dashboard** | `/dashboard` | Ringkasan: omset hari ini, stok menipis, transaksi terakhir |
| **POS (Kasir)** | `/pos` | Layar kasir untuk memproses penjualan |
| **Produk** | `/products` | Kelola produk, kategori, stok |
| **Transaksi** | `/transactions` | Riwayat semua transaksi |
| **Laporan** | `/reports` | Grafik, statistik, export data |
| **Pengaturan** | `/settings` | Profil toko, pembayaran, printer, akun |
| Riwayat Aktivitas | `/activity-history` | Log semua aktivitas di toko |

---

## 🔐 Keamanan

- **Autentikasi**: Supabase Auth (email + password)
- **Row Level Security (RLS)**: Setiap user hanya bisa mengakses data toko miliknya sendiri
- **Semua 7 tabel** dilindungi RLS dengan policy yang memverifikasi `user_id` melalui tabel `stores`

---

## 📄 Lisensi

MIT License — Lihat file [LICENSE](./LICENSE) untuk detail.