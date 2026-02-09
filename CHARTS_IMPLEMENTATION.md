# Fitur Grafik Penjualan dan Item Terlaris - Laporan

## Perubahan yang Dilakukan

### 1. **Instalasi Dependency**

- Menambahkan library `chart.js` (v4.5.1) untuk visualisasi data
- Menambahkan library `vue-chartjs` (v5.3.3) untuk integrasi dengan Vue 3

### 2. **File Baru: `app/composables/useCharts.ts`**

Composable yang menyediakan fungsi-fungsi untuk mengolah data transaksi menjadi format siap untuk chart:

#### Fungsi yang Tersedia:

- **`getSalesByDate(transactions)`** - Mengelompokkan penjualan berdasarkan tanggal
  - Menampilkan tren penjualan harian
  - Output: object dengan `dates` dan `sales`

- **`getSalesByPaymentMethod(transactions)`** - Mengelompokkan penjualan berdasarkan metode pembayaran
  - Membandingkan antara pembayaran Tunai vs Transfer
  - Output: object dengan `methods` dan `amounts`

- **`getTopSellingProducts(transactions, limit)`** - Mendapatkan produk terlaris
  - Menampilkan 5 produk dengan penjualan terbanyak (qty)
  - Output: object dengan `products`, `quantities`, dan `sales`

- **`getTransactionCountByMethod(transactions)`** - Menghitung jumlah transaksi per metode pembayaran
  - Membandingkan jumlah transaksi tunai vs transfer
  - Output: object dengan `methods` dan `counts`

### 3. **Pembaruan: `app/pages/reports/index.vue`**

#### Penambahan Import:

```typescript
import { Line, Bar, Pie, Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
```

#### Computed Properties untuk Chart Data:

1. **`salesByDateData`** - Data untuk Line Chart (Tren Penjualan)
   - Menampilkan grafik garis dengan tren penjualan harian
   - Warna biru dengan area di bawah kurva

2. **`topProductsData`** - Data untuk Bar Chart (Produk Terlaris)
   - Menampilkan 5 produk dengan penjualan terbanyak
   - Berbagai warna untuk membedakan setiap produk

3. **`paymentMethodData`** - Data untuk Pie Chart (Metode Pembayaran - Penjualan)
   - Membandingkan nilai penjualan tunai vs transfer
   - Hijau untuk Tunai, Oranye untuk Transfer

4. **`paymentMethodCountData`** - Data untuk Doughnut Chart (Metode Pembayaran - Jumlah Transaksi)
   - Membandingkan jumlah transaksi tunai vs transfer
   - Cyan untuk Tunai, Pink untuk Transfer

#### Komponen Visual yang Ditambahkan:

1. **Grafik Tren Penjualan** (Line Chart)
   - Menampilkan penjualan harian dalam bentuk garis
   - Responsive dan interaktif
   - Menampilkan tooltip saat di-hover

2. **Grafik Produk Terlaris** (Bar Chart)
   - Top 5 produk berdasarkan jumlah terjual
   - Bar berwarna-warni untuk setiap produk
   - Mudah dibandingkan antar produk

3. **Grafik Metode Pembayaran** (Pie Chart)
   - Proporsi nilai penjualan per metode pembayaran
   - Format pie chart yang menarik

4. **Grafik Jumlah Transaksi** (Doughnut Chart)
   - Proporsi jumlah transaksi per metode pembayaran
   - Format doughnut untuk tampilan yang lebih elegan

5. **Tabel Item Terlaris**
   - Menampilkan daftar lengkap produk terlaris
   - Kolom: No, Nama Produk, Jumlah Terjual, Total Penjualan
   - Hover effect untuk pengalaman pengguna yang lebih baik
   - Berisi 10 produk teratas (bisa dikustomisasi)

## Fitur Unggulan

✅ **Real-time Data** - Semua chart menggunakan data transaksi terkini
✅ **Filter Support** - Chart otomatis update saat mengubah filter tanggal/metode pembayaran
✅ **Responsive Design** - Tampilan mobile-friendly (grid 1 kolom di mobile, 2 kolom di desktop)
✅ **Interactive Charts** - Hover, zoom, dan tooltip interaktif
✅ **Data Insights** - Mudah melihat performa penjualan dan produk populer
✅ **Loading States** - Menampilkan pesan saat tidak ada data

## Tampilan Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Header Laporan                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Stats Cards (Total Penjualan, Total Transaksi, Rata-rata)      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐  ┌──────────────────────────────┐
│   Grafik Tren Penjualan      │  │   Grafik Produk Terlaris     │
│   (Line Chart)               │  │   (Bar Chart - Top 5)        │
└──────────────────────────────┘  └──────────────────────────────┘

┌──────────────────────────────┐  ┌──────────────────────────────┐
│  Metode Pembayaran (Pie)     │  │  Jumlah Transaksi (Doughnut)│
│  Berdasarkan Penjualan       │  │  Per Metode Pembayaran      │
└──────────────────────────────┘  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Tabel Item Terlaris                            │
│  No │ Nama Produk │ Jumlah Terjual │ Total Penjualan          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Transaksi Terakhir                            │
│   (Bagian yang sudah ada sebelumnya)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Cara Penggunaan

1. Navigasi ke halaman Laporan (Reports)
2. Gunakan filter untuk memilih rentang tanggal dan metode pembayaran
3. Lihat grafik yang secara otomatis update sesuai filter
4. Analisis:
   - **Tren Penjualan** - Melihat pola penjualan harian
   - **Produk Terlaris** - Mengetahui produk mana yang paling laku
   - **Metode Pembayaran** - Perbandingan antara tunai dan transfer
   - **Tabel Item Terlaris** - Detail lengkap produk populer

## Customization

Anda bisa mengubah:

- **Jumlah top products**: Ubah parameter `limit` di function call `getTopSellingProducts(transactions, 5)`
- **Warna chart**: Ubah nilai `backgroundColor` dan `borderColor` di computed properties
- **Tipe chart**: Ganti `Line`, `Bar`, `Pie`, `Doughnut` dengan tipe lain yang didukung Chart.js
- **Labels**: Ubah string label (Penjualan Harian, Produk Terlaris, dll)

## Technical Stack

- **Chart Library**: Chart.js 4.5.1
- **Vue Integration**: vue-chartjs 5.3.3
- **Framework**: Nuxt 4.2.2
- **UI Framework**: Nuxt UI 4.4.0

## File yang Dimodifikasi/Dibuat

1. ✨ `app/composables/useCharts.ts` - **BARU**
2. 📝 `app/pages/reports/index.vue` - **DIMODIFIKASI**
3. 📦 `package.json` - **DIMODIFIKASI** (tambah dependencies)
