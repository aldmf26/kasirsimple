# Setup Foto Produk

## Konfigurasi Supabase Storage

Untuk menggunakan fitur upload foto produk, Anda perlu setup bucket di Supabase:

### 1. Buat Bucket Storage

Di Supabase Dashboard:

1. Go to **Storage** → **Buckets**
2. Click **New Bucket**
3. Name: `products`
4. Uncheck "Private bucket" untuk public access
5. Click **Create Bucket**

### 2. Setup RLS Policy (Jika Diperlukan)

Di **Storage** → **Policies**:

```sql
-- Allow public read
CREATE POLICY "Public Read" ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id = 'products'
);
```

## Fitur Foto Produk

### Settings - Aktifkan/Nonaktifkan Foto

Di **Settings → Pembayaran**:

- **Tampilkan Foto**: Foto produk ditampilkan di POS dan Products
- **Sembunyikan Foto**: Mode hemat, hanya nama + harga + stok

### Upload Foto Produk

Saat membuat/edit produk:

**Opsi 1: Upload dari Device**

- Klik tombol "📤 Upload dari Device"
- Pilih file gambar (max 5MB)
- Gambar akan langsung di-upload ke Supabase

**Opsi 2: Paste Link**

- Masukkan URL gambar langsung
- Misal: `https://cdn.example.com/product-image.jpg`

### Kondisi Foto Nonaktif

Jika Anda menonaktifkan fitur foto di Settings:

- Tombol upload akan tersembunyi
- Pesan warning: "Fitur foto dimatikan"
- Foto masih ditampilkan jika sudah ada di database
- Untuk mengaktifkan kembali, go to Settings → Pembayaran → Aktifkan "Tampilkan Foto"

## Troubleshooting

### Upload Gagal

Jika melihat pesan "Upload foto gagal":

1. Pastikan bucket `products` sudah dibuat di Supabase
2. Cek ukuran file tidak lebih dari 5MB
3. Gunakan format gambar standar (jpg, png, gif, webp, etc)
4. Fallback: Gunakan link URL langsung ke gambar

### Foto Tidak Muncul di POS

1. Check Settings → Pembayaran → "Tampilkan Foto" harus ON
2. Pastikan produk memiliki image_url (bukan kosong)
3. URL gambar harus accessible/bukan local path

### Bagaimana Jika Tidak Ada Storage?

Fitur foto bersifat opsional:

- Jika storage tidak setup, upload akan fail dengan warning
- Anda masih bisa pakai link URL langsung
- Foto sudah ada di database akan tetap ditampilkan

---

Last Updated: 2026-02-10
