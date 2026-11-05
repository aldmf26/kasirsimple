# Update KasirOK

**Keamanan**
- Kolom admin & langganan dikunci (022)
- PIN Owner dicek di server (023)
- Logout di Pengaturan benar-benar keluar

**Data**
- Nomor nota unik per toko, simpan transaksi atomik (026)
- Status retur pakai kolom, tanggal sesuai zona toko, laporan & backup tidak terpotong 1000 baris

**Kasir**
- Keranjang mobile: bar total + sheet
- Pilih pelanggan terdaftar

**Fitur baru**
- Stok menipis: Beranda, badge menu, form batas stok
- Laporan: grafik diperbaiki, perbandingan periode, tombol Bulan Ini
- Hutang pelanggan + cicilan (025)
- PWA: bisa di-install, jualan offline + sync otomatis
- Zona waktu toko (WIB/WITA/WIT) di Pengaturan: nota, struk, laporan, shift

**Wajib sebelum deploy:** jalankan migration 022–026 di Supabase (024 opsional).

**Setelah deploy:** toko lama tersimpan WIB, pilih WITA di Pengaturan bila perlu.
