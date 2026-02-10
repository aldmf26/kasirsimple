# 🍵 POS KASIR CAFE - ROADMAP SIMPEL

> Fokus: **Aplikasi kasir sederhana untuk Cafe, Laundry, Barber**

---

## ✅ FITUR YANG SUDAH ADA

- ✅ Produk management (CRUD)
- ✅ POS transaksi basic (add item ke cart)
- ✅ Metode pembayaran (Tunai, QRIS, Transfer)
- ✅ Stock tracking
- ✅ Receipt thermal printer
- ✅ Settings & profile toko
- ✅ Dashboard dengan grafik
- ✅ Auto-save (no button needed)

---

## 🔴 PRIORITAS 1: URGENT (Minggu 1)

### 1️⃣ **DISKON** - HARUS ADA

| Aspek         | Detail      |
| ------------- | ----------- |
| **Urgency**   | 🔴 CRITICAL |
| **Waktu**     | 2-3 hari    |
| **Kesulitan** | 🟢 Easy     |
| **Impact**    | ⭐⭐⭐⭐⭐  |

**Fitur:**

```
Di halaman POS (saat checkout):
├── Input total diskon (Rp atau %)
├── Input alasan diskon (opsional)
├── Hitung ulang total otomatis
└── Tampilkan di receipt

Contoh:
- Total: Rp 100,000
- Diskon: Rp 10,000 (atau 10%)
- Final: Rp 90,000
```

**Implementasi:**

- Tambah `discount_amount` & `discount_type` (fixed/percent) di transaction
- Update POS cart calculation
- Update receipt template

---

### 2️⃣ **KASIR BUKA / TUTUP** - SIMPLE

| Aspek         | Detail      |
| ------------- | ----------- |
| **Urgency**   | 🔴 CRITICAL |
| **Waktu**     | 2-3 hari    |
| **Kesulitan** | 🟢 Easy     |
| **Impact**    | ⭐⭐⭐⭐⭐  |

**Fitur:**

```
PAGI (Buka Kasir):
├── Modal awal (input cash)
├── Auto-timestamp
└── Ready to sell

SORE (Close Kasir):
├── System count: totalnya berapa?
├── Manual count: fisik uang berapa?
├── Selisih auto-hitung
├── Save + Generate laporan hari ini
```

**Contoh sederhana:**

```
BUKA: Modal Rp 500K
├── Revenue hari ini: Rp 2,500K
├── Final cash: Rp 3,000K (500K + 2,500K)

TUTUP: Manual count
├── Hitung fisik: Rp 2,950K
├── Selisih: -Rp 50K
├── Alasan: "Beli snack sendiri"
└── ✅ Settled
```

---

### 3️⃣ **QUICK BUTTONS - PRODUK FAVORIT**

| Aspek         | Detail   |
| ------------- | -------- |
| **Urgency**   | 🟠 High  |
| **Waktu**     | 1-2 hari |
| **Kesulitan** | 🟢 Easy  |
| **Impact**    | ⭐⭐⭐⭐ |

**Fitur:**

```
Di POS page - row favorit produk:
├── Tampilkan 8-10 produk terlaris
├── 1 klik = langsung add ke cart
├── Opsional: drag-reorder
└── Edit dari settings

Contoh untuk CAFE:
- Kopi Tawar
- Kopi Gula
- Teh Hangat
- Nescafe
- Roti Bakar
```

---

## 🟡 PRIORITAS 2: PENTING (Minggu 2-3)

### 4️⃣ **DINE-IN vs TAKEAWAY**

| Aspek         | Detail   |
| ------------- | -------- |
| **Urgency**   | 🟠 High  |
| **Waktu**     | 1-2 hari |
| **Kesulitan** | 🟢 Easy  |
| **Impact**    | ⭐⭐⭐⭐ |

**Fitur:**

```
Saat buat transaksi:
├── Pilih: Dine-in / Takeaway
├── Jika dine-in → opsi meja/table
└── Di receipt: "DINE-IN" atau "TAKEAWAY"

Untuk cafe/laundry:
- Cafe: Dine-in (meja), Takeaway
- Laundry: Ambil (pick-up date), Delivery
- Barber: N/A (bisa skip)
```

---

### 5️⃣ **MEJA / SECTION TRACKING** (Untuk Cafe)

| Aspek         | Detail    |
| ------------- | --------- |
| **Urgency**   | 🟠 High   |
| **Waktu**     | 2-3 hari  |
| **Kesulitan** | 🟡 Medium |
| **Impact**    | ⭐⭐⭐⭐  |

**Fitur:**

```
Cafe Management:
├── Kelola daftar meja (Meja 1-10, dll)
├── Status: Kosong / Terisi / Waiting
├── Click meja → buka transaksi
├── Pelanggan di meja tersimpan
├── Saat bayar → meja jadi kosong

Dashboard:
├── Layout visual meja
├── Color: Hijau (kosong), Merah (terisi)
└── Click untuk lihat order

Contoh CAFE:
- Meja 1: Pelanggan A - Kopi + Cake - Belum bayar
- Meja 2: Kosong
- Meja 3: Pelanggan B - Nescafe - Sudah bayar → free
```

---

### 6️⃣ **DAILY REPORT RINGKAS**

| Aspek         | Detail   |
| ------------- | -------- |
| **Urgency**   | 🟠 High  |
| **Waktu**     | 1-2 hari |
| **Kesulitan** | 🟢 Easy  |
| **Impact**    | ⭐⭐⭐⭐ |

**Fitur:**

```
Saat Close Kasir, tampilkan:
├── Total transaksi hari ini
├── Breakdown: Cash / QRIS / Transfer
├── Total diskon hari ini
├── Tabel: 5 produk terlaris
├── Waktu: 08:00 - 18:00
└── Export PDF (optional)

Contoh:
================================
LAPORAN HARIAN - 10 Feb 2024
================================
Total Revenue: Rp 5,500,000
├── Cash:     Rp 3,200,000 (58%)
├── QRIS:     Rp 1,800,000 (33%)
└── Transfer: Rp 500,000  (9%)

Total Diskon: Rp 250,000
Jumlah Transaksi: 45

TOP 5 PRODUK:
1. Kopi Tawar (25 qty) - Rp 1,250K
2. Teh Hangat (20 qty) - Rp 400K
3. Cake (18 qty) - Rp 900K
4. Nescafe (15 qty) - Rp 750K
5. Roti Bakar (12 qty) - Rp 480K
================================
```

---

## 🟢 PRIORITAS 3: NICE-TO-HAVE (Minggu 4+)

### 7️⃣ **SERVICE CHARGE / TIPS**

| Aspek         | Detail  |
| ------------- | ------- |
| **Urgency**   | 🟢 Low  |
| **Waktu**     | 1 hari  |
| **Kesulitan** | 🟢 Easy |
| **Impact**    | ⭐⭐⭐  |

**Fitur:**

```
Saat checkout:
├── Add service charge (fixed Rp atau %)
├── Show di total
└── Masuk ke receipt

Contoh:
- Total: Rp 100K
- Service 10%: Rp 10K
- Grand Total: Rp 110K
```

---

### 8️⃣ **CUSTOMER LOYALTY / POIN** (Optional)

| Aspek         | Detail    |
| ------------- | --------- |
| **Urgency**   | 🟢 Low    |
| **Waktu**     | 3-4 hari  |
| **Kesulitan** | 🟡 Medium |
| **Impact**    | ⭐⭐⭐    |

**Fitur sederhana:**

```
Tracking customer minimal:
├── Nama + kontak
├── Poin per transaksi (1 Rp = 1 Poin)
├── Tukar poin jadi diskon (1000 Poin = Rp 10K off)
└── Lihat history di customer profile
```

---

### 9️⃣ **ORDER PRINT / KITCHEN TICKET** (Minimal)

| Aspek         | Detail    |
| ------------- | --------- |
| **Urgency**   | 🟢 Low    |
| **Waktu**     | 2-3 hari  |
| **Kesulitan** | 🟡 Medium |
| **Impact**    | ⭐⭐⭐⭐  |

**Fitur sederhana:**

```
Di saat transaksi dibuat:
├── Print order ke printer terpisah
├── Format: Item + qty + waktu
└── Kitchen/barista lihat dan buat

Contoh:
ORDER #2024-001337 - 10:45
═════════════════════════════
① Kopi Tawar (2x)
② Cake Choco (1x)
③ Teh Hangat (1x)
═════════════════════════════
Meja 3 / Dine-in
```

---

## ❌ JANGAN IMPLEMENTASI DULU (TOO COMPLEX)

**Fitur yang skip untuk saat ini:**

| Fitur                        | Alasan                                       |
| ---------------------------- | -------------------------------------------- |
| 🚫 Hutang Pelanggan          | Kompleks, untuk toko kelontong lebih         |
| 🚫 Supplier Management       | Tidak perlu untuk cafe                       |
| 🚫 Inventory Auto-Restock    | Cafe tidak perlu, laundry ga ada stock ribet |
| 🚫 Employee Management/Shift | Biar simple terlebih dulu                    |
| 🚫 Multi-warehouse           | Cafe usually 1 lokasi                        |
| 🚫 Advanced Analytics        | Dashboard simple cukup                       |
| 🚫 Credit Card Processing    | Simpel aja QRIS + Transfer                   |
| 🚫 Accounting/Bookkeeping    | Luar scope POS                               |

---

## 📋 CHECKLIST IMPLEMENTASI

### Phase 1 (Minggu 1) - URGENT

- [ ] Diskon fitur di POS
- [ ] Kasir buka/tutup + simple settlement
- [ ] Quick buttons (favorit produk)

### Phase 2 (Minggu 2-3) - PENTING

- [ ] Dine-in vs Takeaway option
- [ ] Meja/Table tracking (untuk cafe)
- [ ] Daily report ringkas

### Phase 3 (Minggu 4+) - NICE

- [ ] Service charge / Tips
- [ ] Customer loyalty (optional)
- [ ] Kitchen ticket print

---

## 🎯 TIMELINE ESTIMASI

| Phase       | Waktu          | Deliverable                    |
| ----------- | -------------- | ------------------------------ |
| **Phase 1** | 3-5 hari       | Diskon + Kasir + Quick buttons |
| **Phase 2** | 5-7 hari       | Dine-in + Meja + Report        |
| **Phase 3** | 4-5 hari       | Service charge + Loyalty       |
| **Total**   | **2-3 minggu** | Full POS Cafe Ready            |

---

## 💡 TIPS IMPLEMENTASI

1. **Diskon dulu** - ini yang paling critical
2. **Kasir buka/tutup** - simple tapi essential untuk akuntansi
3. **Quick buttons** - speed up order entry
4. **Jangan terburu** - test setiap fitur dulu sebelum lanjut
5. **Mobile-first** - ensure responsive design
6. **Tap friendly** - button besar, mudah diklik

---

## 🔗 HUBUNGAN ANTAR FITUR

```
DISKON
  ├── Update transaction model
  ├── Update POS checkout
  └── Update receipt

KASIR BUKA/TUTUP
  ├── Create cash_registers table
  ├── Create settlement calculation
  └── Generate daily report

QUICK BUTTONS
  ├── Modify favorites system
  └── Add UI di POS page

DINE-IN vs TAKEAWAY
  ├── Add field ke transaction
  └── Update receipt format

MEJA TRACKING (TERGANTUNG: Dine-in)
  ├── Create tables/sections table
  ├── Link transaction ke meja
  └── Add dashboard layout

DAILY REPORT
  ├── Consolidate data dari transactions
  └── Display summary
```

---

## 📱 USER FLOW - CAFE BARISTA

```
08:00 - PAGI:
1. Buka app
2. Settings → Buka Kasir (input Rp 500K)
3. Dashboard siap

09:00 - TRANSAKSI PERTAMA:
1. Click "New Order"
2. Meja 1 / Dine-in
3. Quick button: Kopi (2x) + Cake (1x)
4. Diskon Rp 10K
5. Checkout → Print receipt + kitchen ticket
6. Customer bayar QRIS
7. Meja 1 jadi "Kosong"

17:00 - TUTUP KASIR:
1. Click "Close Register"
2. Manual count: Rp 2,950K
3. System: Harus Rp 3,000K
4. Selisih: -50K
5. Save
6. Daily report otomatis tampil
7. Export PDF (optional)
```

---

## 🎨 UI CHANGES SUMMARY

### POS Page - ADD:

- Diskon input field sebelum checkout
- Dine-in/Takeaway toggle
- Meja selector (jika cafe)
- Quick buttons row di atas

### Settings - ADD:

- "Buka Kasir" button (pagi)
- "Close Kasir" button (sore)
- Favorites management

### Dashboard - ADD:

- Daily summary widget
- Meja status (jika cafe)

---

**Next Step:** Mulai dari DISKON dulu, baru yang lain!
