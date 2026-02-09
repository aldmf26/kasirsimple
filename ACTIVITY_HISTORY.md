# Activity History / Riwayat Aktivitas

## Overview

Activity History adalah fitur untuk mencatat dan melacak semua aktivitas pengguna dalam sistem POS Kasir Simple. Ini membantu:

- Audit trail untuk keamanan dan compliance
- Tracking perubahan data (produk, stok, transaksi)
- Investigasi kesalahan atau penyalahgunaan
- Akuntabilitas pengguna (siapa melakukan apa dan kapan)

## Cara Kerja

### Storage

- **Lokasi**: Browser localStorage
- **Durasi**: Otomatis terhapus setelah 3 bulan (90 hari)
- **Kapasitas**: Tergantung kapasitas localStorage browser (~5-10MB)
- **Sinkronisasi**: Per-browser (data tidak disinkronisasi antar device)

### Alur Logging

```
User Action → logToActivity() → localStorage → Activity History Page
```

## Implementasi

### 1. Logging Activity (Simple Method)

```typescript
import { logToActivity, ACTIVITY_TYPES } from "~/utils/activityLogger";

// Gunakan ini di manapun Anda perlu log activity
logToActivity(
  storeId, // Required
  ACTIVITY_TYPES.TRANSACTION_DELETED, // Action type
  {
    // Details (optional)
    transactionNumber: "TRX-001",
    totalAmount: 50000,
    itemCount: 3,
  },
  transactionId, // Related ID (optional)
  userId, // User ID (optional)
);
```

### 2. Activity Composable (Advanced Method)

```typescript
const { logActivity, fetchActivityLogs } = useActivityLog();

// Log activity
logActivity(ACTIVITY_TYPES.PRODUCT_CREATED, {
  productName: "Mie Instan",
  sku: "SKU-001",
  price: 5000,
});

// Fetch dengan filter
const result = fetchActivityLogs({
  action: "PRODUCT_CREATED",
  startDate: "2026-01-01",
  endDate: "2026-02-09",
  search: "Mie",
  limit: 20,
  offset: 0,
});
// Result: { data: [...], total: 100, count: 20 }
```

## Activity Types

### Transactions

- `TRANSACTION_CREATED` - Transaksi dibuat
- `TRANSACTION_DELETED` - Transaksi dihapus
- `TRANSACTION_REFUNDED` - Transaksi di-refund

### Products

- `PRODUCT_CREATED` - Produk ditambah
- `PRODUCT_UPDATED` - Produk diubah
- `PRODUCT_DELETED` - Produk dihapus

### Stock

- `STOCK_ADJUSTMENT` - Sesuaikan stok
- `STOCK_IN` - Stok masuk
- `STOCK_OUT` - Stok keluar

### Categories

- `CATEGORY_CREATED` - Kategori ditambah
- `CATEGORY_UPDATED` - Kategori diubah
- `CATEGORY_DELETED` - Kategori dihapus

### System

- `STORE_SETTINGS_UPDATED` - Setting toko diubah
- `USER_LOGIN` - User login
- `USER_LOGOUT` - User logout
- `CASH_REGISTER_OPENED` - Kasir dibuka
- `CASH_REGISTER_CLOSED` - Kasir ditutup

## Menampilkan Activity History

### Menu di Settings

Settings → Riwayat Aktivitas → Lihat semua aktivitas

### Filter & Search

- **Jenis Aktivitas**: Filter berdasarkan action type
- **Tanggal**: Filter berdasarkan date range
- **Pencarian**: Search di action name atau details

### Export

Klik tombol "Export" untuk download semua logs dalam format JSON

## File Structure

```
app/
├── composables/
│   └── useActivityLog.ts          # Composable utama
├── pages/
│   └── activity-history.vue       # UI untuk history page
├── utils/
│   └── activityLogger.ts          # Utility/helper untuk logging
└── types/
    └── ActivityLog interface
```

## Implementation Checklist

### Completed ✅

- [x] useActivityLog composable (localStorage-based)
- [x] activity-history.vue page dengan filtering & search
- [x] Settings menu integration
- [x] Activity logging di transaction deletion
- [x] Auto-cleanup after 3 months
- [x] Export logs as JSON

### To-Do 📋

- [ ] Log activity pada product CRUD (create, update, delete)
- [ ] Log activity pada stock adjustments
- [ ] Log activity pada category CRUD
- [ ] Log activity pada user login/logout
- [ ] Log activity pada cash register operations
- [ ] Display user name/email di activity history (bukan hanya ID)
- [ ] Real-time updates (WebSocket atau polling)
- [ ] Advanced analytics/reports dari activity data

## Code Examples

### Example: Log Product Creation

```typescript
// In useProducts composable
const createProduct = async (productData: any) => {
  // ... create product logic ...

  if (store.value?.id) {
    logToActivity(
      store.value.id,
      ACTIVITY_TYPES.PRODUCT_CREATED,
      {
        productName: productData.name,
        sku: productData.sku,
        category: productData.category,
        price: productData.price,
        stock: productData.stock,
      },
      newProduct.id,
      user.value?.id,
    );
  }
};
```

### Example: Log Stock Adjustment

```typescript
// In useProducts composable
const updateStock = async (productId: string, newStock: number) => {
  const oldStock = product.stock;

  // ... update stock logic ...

  if (store.value?.id) {
    logToActivity(
      store.value.id,
      ACTIVITY_TYPES.STOCK_ADJUSTMENT,
      {
        productId,
        productName: product.name,
        oldStock,
        newStock,
        difference: newStock - oldStock,
      },
      productId,
      user.value?.id,
    );
  }
};
```

## Data Structure

Activity log item di localStorage:

```json
{
  "id": "abc123def",
  "store_id": "store-uuid-here",
  "user_id": "user-uuid-here",
  "action": "TRANSACTION_DELETED",
  "details": {
    "transactionNumber": "TRX-20260209-001",
    "totalAmount": 50000,
    "itemCount": 3,
    "paymentMethod": "cash"
  },
  "related_id": "transaction-uuid",
  "timestamp": "2026-02-09T12:34:56Z",
  "user_agent": "Mozilla/5.0..."
}
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance Considerations

- localStorage limit: ~5-10MB per domain
- Dengan ~100 activities per hari, bisa tersimpan ~2-3 bulan
- Auto-cleanup after 3 months memastikan tidak melampaui limit
- Queries di localStorage cepat (filtering dilakukan in-memory)

## Security Notes

- Data disimpan di browser (client-side)
- Tidak aman untuk data super sensitif (gunakan server-side audit trail jika perlu)
- localStorage bisa diakses via DevTools (tidak untuk password/keys)
- Data tidak terenkripsi (browser menangani ini)

## Future Enhancements

1. **Server-side backup**: Sync ke server setiap hari
2. **Advanced analytics**: Dashboard untuk analyze activity patterns
3. **Real-time updates**: Socket untuk multiple users
4. **Detailed diffs**: Simpan before/after values untuk changes
5. **User attribution**: Display nama user bukan ID
6. **Custom retention**: Setting untuk retention period per toko

## Troubleshooting

### Activity tidak muncul

1. Cek browser console untuk errors
2. Cek localStorage capacity (DevTools → Application → localStorage)
3. Refresh page dan coba lagi

### Data hilang

- Data otomatis dihapus setelah 3 bulan (by design)
- Browser cache clear juga menghapus activity logs
- Export data secara regular jika perlu backup

### Performance lambat

- Terlalu banyak filter query
- Browser storage hampir penuh
- Coba export & clear old logs
