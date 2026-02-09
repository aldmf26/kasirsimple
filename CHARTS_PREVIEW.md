# Preview: Grafik Penjualan dan Item Terlaris

## 📊 Grafik yang Ditampilkan

### 1. Tren Penjualan (Line Chart)

```
Penjualan Harian
│
│     ╱╲
│    ╱  ╲    ╱╲
│   ╱    ╲  ╱  ╲
│  ╱      ╲╱    ╲
└─────────────────────────────
  1 Feb  2 Feb  3 Feb  4 Feb
```

- **Warna**: Biru dengan area di bawah
- **Informasi**: Penjualan per hari
- **Interaktif**: Hover untuk lihat detail nilai
- **Responsif**: Otomatis menyesuaikan dengan lebar layar

---

### 2. Produk Terlaris (Bar Chart - Top 5)

```
Jumlah Terjual
│
80│        ▄ Produk 1
  │     ▄  ▄ Produk 2
60│     █  █ Produk 3
  │  ▄  █  █ Produk 4
40│  █  █  █ Produk 5
  │  █  █  █
20│  █  █  █
  │  █  █  █
0 └──────────
   A  B  C  D  E
```

- **Warna**: Berbeda untuk setiap produk (Biru, Ungu, Pink, Oranye, Hijau)
- **Informasi**: 5 produk dengan penjualan terbanyak
- **Interaktif**: Hover untuk lihat exact value

---

### 3. Metode Pembayaran - Penjualan (Pie Chart)

```
        ╭─────────╮
       ╱ Tunai 60% ╲      Tunai (Hijau)
      │             │     Transfer (Oranye)
      │  Transfer   │
       ╲    40%    ╱
        ╰─────────╯
```

- **Warna**: Hijau (Tunai), Oranye (Transfer)
- **Informasi**: Proporsi penjualan per metode pembayaran
- **Interaktif**: Click untuk highlight

---

### 4. Jumlah Transaksi (Doughnut Chart)

```
      ╭──────────╮
     ╱ Tunai     ╲      Tunai (Cyan)
    │ 55 trx     │      Transfer (Pink)
    │             │
     ╲ Transfer  ╱
      ╚──────────╝
        45 trx
```

- **Warna**: Cyan (Tunai), Pink (Transfer)
- **Informasi**: Jumlah transaksi per metode pembayaran
- **Format**: Doughnut (donut shape) untuk tampilan elegan

---

### 5. Tabel Item Terlaris

```
┌─────┬─────────────────────┬──────────────┬──────────────────┐
│ No  │ Nama Produk         │ Jumlah Terjual│ Total Penjualan │
├─────┼─────────────────────┼──────────────┼──────────────────┤
│ 1   │ Kopi Premium        │ 245 unit     │ Rp 2.450.000    │
│ 2   │ Teh Manis           │ 198 unit     │ Rp 1.980.000    │
│ 3   │ Roti Tawar          │ 156 unit     │ Rp 1.560.000    │
│ 4   │ Snack Kemasan       │ 142 unit     │ Rp 1.420.000    │
│ 5   │ Minyak Goreng       │ 98 unit      │ Rp 980.000      │
│ 6   │ Gula Pasir          │ 87 unit      │ Rp 870.000      │
│ 7   │ Garam Dapur         │ 76 unit      │ Rp 760.000      │
│ 8   │ Telur Ayam          │ 65 unit      │ Rp 650.000      │
│ 9   │ Beras Premium       │ 54 unit      │ Rp 540.000      │
│ 10  │ Susu Bubuk          │ 43 unit      │ Rp 430.000      │
└─────┴─────────────────────┴──────────────┴──────────────────┘
```

- **Kolom**: No, Nama Produk, Jumlah Terjual, Total Penjualan
- **Hover Effect**: Background berubah warna saat di-hover
- **Jumlah Baris**: Menampilkan top 10 produk (bisa dikustomisasi)

---

## 🎯 Manfaat Fitur

### Untuk Pemilik Toko

✅ Melihat tren penjualan dengan jelas
✅ Mengetahui produk mana yang paling laku
✅ Membandingkan metode pembayaran (tunai vs transfer)
✅ Membuat keputusan stok berdasarkan data produk terlaris
✅ Analisis performa toko dalam satu dashboard

### User Experience

✅ Interface yang intuitif dan mudah dipahami
✅ Grafik interaktif (hover, tooltip, legend)
✅ Responsive design untuk semua ukuran layar
✅ Loading states yang jelas
✅ Warna dan desain yang konsisten dengan tema aplikasi

---

## 🔧 Integrasi dengan Filter Existing

Semua grafik otomatis terupdate ketika user:

- Memilih filter "Hari Ini", "7 Hari", "30 Hari", "Tahun Ini"
- Memilih rentang tanggal custom
- Mengubah filter metode pembayaran (Semua, Tunai, Transfer)

Contoh workflow:

```
1. User klik "7 Hari" → setFilter('week')
2. loadData() terpanggil
3. fetchTransactions() dengan filter baru
4. Semua chart computed properties re-render
5. Grafik update dengan data 7 hari terakhir
```

---

## 📱 Responsive Layout

### Desktop (lg:)

```
┌────────────────────────────────────────┐
│  Grafik Tren Penjualan │ Produk Terlaris │
├────────────────────────────────────────┤
│ Metode Pembayaran │ Jumlah Transaksi   │
├────────────────────────────────────────┤
│  Tabel Item Terlaris (Full Width)      │
└────────────────────────────────────────┘
```

### Mobile (< lg:)

```
┌─────────────────────────┐
│ Grafik Tren Penjualan   │
├─────────────────────────┤
│ Produk Terlaris         │
├─────────────────────────┤
│ Metode Pembayaran       │
├─────────────────────────┤
│ Jumlah Transaksi        │
├─────────────────────────┤
│ Tabel Item Terlaris     │
└─────────────────────────┘
```

---

## 🎨 Palet Warna

| Elemen     | Warna  | Hex     | Penggunaan             |
| ---------- | ------ | ------- | ---------------------- |
| Line Chart | Biru   | #3b82f6 | Tren penjualan         |
| Bar 1      | Biru   | #3b82f6 | Produk terlaris item 1 |
| Bar 2      | Ungu   | #8b5cf6 | Produk terlaris item 2 |
| Bar 3      | Pink   | #ec4899 | Produk terlaris item 3 |
| Bar 4      | Oranye | #f59e0b | Produk terlaris item 4 |
| Bar 5      | Hijau  | #10b981 | Produk terlaris item 5 |
| Pie 1      | Hijau  | #10b981 | Tunai (penjualan)      |
| Pie 2      | Oranye | #f59e0b | Transfer (penjualan)   |
| Doughnut 1 | Cyan   | #06b6d4 | Tunai (transaksi)      |
| Doughnut 2 | Pink   | #f43f5e | Transfer (transaksi)   |

---

## 💡 Tips Penggunaan

1. **Analisis Tren Harian**
   - Filter "7 Hari" atau "30 Hari" untuk melihat pola penjualan
   - Identifikasi hari dengan penjualan tinggi dan rendah

2. **Optimasi Stok Produk**
   - Lihat top 5 produk terlaris
   - Prioritaskan restock produk yang paling laku
   - Pertimbangkan untuk mengurangi stok produk yang jarang terjual

3. **Analisis Metode Pembayaran**
   - Monitor perubahan proporsi tunai vs transfer
   - Bandingkan jumlah transaksi dengan nilai penjualan
   - Contoh: Banyak transaksi tunai tapi nilai transfer lebih tinggi?

4. **Decision Making**
   - Gunakan data chart untuk promosi strategis
   - Plan bundle products berdasarkan top sellers
   - Forecast inventory untuk produk populer

---

## 🚀 Development

Untuk menambah chart baru atau memodifikasi existing:

1. **Tambah fungsi di `useCharts.ts`**

   ```typescript
   const getNewChartData = (transactions: any[]) => {
     // Process data
     return { labels: [], data: [] };
   };
   ```

2. **Tambah computed property di reports/index.vue**

   ```typescript
   const newChartData = computed(() => {
     return {
       /* chart config */
     };
   });
   ```

3. **Tambah komponen di template**
   ```vue
   <Bar :data="newChartData" :options="chartOptions" />
   ```

Mudah, clean, dan maintainable! 🎉
