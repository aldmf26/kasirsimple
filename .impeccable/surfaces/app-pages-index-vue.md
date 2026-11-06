---
version: 1
slug: "app-pages-index-vue"
primary_target: "app/pages/index.vue"
related_targets: ["app/layouts/landing.vue"]
---

Scope: landing page `/` (Persuade). Visitor: pemilik warung/konter/laundry, buka dari HP spek rendah. Action: chat WhatsApp (utama), daftar (sekunder). Proof: demo transaksi di layar app sendiri; tidak ada testimoni.

## Direction contract

THESIS: Satu belanjaan yang sama dihitung dua cara — kalkulator + buku vs KasirOK. Menolak hero split generik + grid 6 kartu ikon + eyebrow ungu.

OWN-WORLD: Dunia app KasirOK sendiri: putih/slate-50, biru #2563EB, kuning logo #F0C624 sebagai sorotan harga, ink #0F172A, Inter berat 800–900, kartu rounded-2xl ala layar POS, kertas struk zigzag monospace hanya untuk angka struk.

STORY: Pengunjung lihat barang warung jatuh ke tumpukan dan HP langsung menjumlah + cetak struk; lalu tabel tugas harian kalkulator vs KasirOK; lalu isi fitur dengan istilah app; harga Rp29rb/bln atau Rp249rb/thn; chat WA.

FIRST VIEWPORT: Mobile: judul + WA di atas, panggung 3D tumpukan barang (Three.js, lazy) dengan HP app di depan yang menambah baris tiap barang mendarat, struk keluar di akhir. Desktop: copy kiri 5/12, panggung kanan 7/12. Tombol WA terlihat tanpa scroll.

FORM: kalkulator-vs-kasirok, posisi 7 dari daftar; seed:95c6808f6485de9e

SIGNATURE: barang mendarat → baris keranjang + total naik → struk tercetak.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
