# KasirOK — Promo Video 20 detik (Remotion)

Video promosi 1920×1080, 30 fps, **600 frame (tepat 20 detik)**. Dibuat dengan Remotion,
dipisah dari aplikasi Nuxt supaya dependency React tidak masuk ke app POS.

Hasil render: `out/kasirok-promo.mp4`

## Menjalankan

```bash
cd promo-video
npm install
npm run studio      # Remotion Studio, preview + scrub timeline
npm run render      # render ulang ke out/kasirok-promo.mp4
npm run sfx         # buat ulang efek suara + musik placeholder (public/audio)
node scripts/snap.mjs 0 120 300 450 590   # QC: potret frame tertentu ke out/stills
```

## Konsep

Masalah → lenyap + demo satu transaksi (Bang Motion, konsep #3 + #9).

| Frame | Babak | Isi |
|---|---|---|
| 0–90 | Hook | Bon kertas dan kalkulator berserakan, "Masih catat di kertas?" |
| 84–190 | Reveal | Dompet logo naik dan menelan semua kertas. Latar berganti, lalu "Rapikan dengan KasirOK" |
| 176–214 | Transisi | Kamera menembus badge kuning logo, badge mekar jadi jendela kasir |
| 214–410 | Experience | UI /pos: tap Kopi Hitam ×2 dan Nasi Goreng, TOTAL Rp 55.000, BAYAR → PEMBAYARAN → QRIS → SELESAI |
| 398–512 | Value | Modal berubah jadi struk 58mm, kartu berputar: "Transaksi cepat" / "Barang rapi" / "Laporan kebaca" |
| 508–600 | Ending | Kartu dashboard masuk dompet, wordmark KasirOK, CTA WhatsApp |

## Struktur

```
src/
  Root.tsx            Composition KasirOKPromo
  PosPromo.tsx        penyusun babak (Sequence beririsan)
  theme.ts, data.ts   warna, font, data demo (dari app/utils/dummyData.json)
  utils/              timing.ts (semua frame kunci), animations.ts, wallet.ts, ending.ts, frame.ts
  components/         PosWindow (rakitan ulang /pos), ProofCards, KineticText, Logo, Backdrop, Soundtrack…
  scenes/             Hook, Reveal, Experience, Value, Ending
scripts/              make-sfx.mjs, snap.mjs
public/               logo-kasirok.png (salinan public/images/), audio/
```

Semua timing ada di `src/utils/timing.ts`, ditulis dalam frame global (`useGlobalFrame()`).
Seluruh animasi berbasis frame: tidak ada timer, `Math.random`, atau animasi CSS.

## Audio

- Semua efek suara dibuat prosedural oleh `scripts/make-sfx.mjs`, jadi bebas lisensi.
- **Musik masih PLACEHOLDER** (`music-placeholder.wav`, pad sintetis). Cara menggantinya:
  1. Taruh track royalty-free berlisensi di `public/audio/music.mp3` (mis. YouTube Audio Library atau Pixabay Music).
  2. Ubah konstanta `MUSIC` di `src/components/Soundtrack.tsx`.
  3. Jalankan `npm run render`.

## Catatan konten

- UI kasir dirakit ulang dari `app/pages/pos/index.vue` dan `dashboard.vue`: label, warna, dan layout sama dengan app, data dari data demo. Ini bukan screenshot, karena app butuh login.
- Area gambar produk memakai glyph kategori, karena data demo hanya membawa URL foto eksternal.
- Angka "Uang Masuk Hari Ini" (Rp 1.245.000 → Rp 1.300.000, 37 → 38 jualan) adalah angka demo.
- CTA: WhatsApp 0895-4131-11053 (permintaan pemilik).
