// Story 9:16, 60 dtk, tanpa suara: teks besar + efek. Semua waktu = frame global.
export const FPS = 30
export const W = 1080
export const H = 1920
export const TOTAL = 1800

export type Beat = { id: string; from: number; to: number; title?: string; highlight?: string; sub?: string }

// Phone features, in screen order. Each one is a headline + a screen on the phone.
const FEATURE_LEN = 125
const FEATURES: Array<Omit<Beat, 'from' | 'to'>> = [
  { id: 'scan', title: 'Scan barcode', highlight: 'barcode', sub: 'barang langsung masuk' },
  { id: 'pay', title: 'Tunai, QRIS, transfer', highlight: 'QRIS,', sub: 'kembalian otomatis' },
  { id: 'print', title: 'Cetak struk', highlight: 'struk', sub: 'printer bluetooth' },
  { id: 'stock', title: 'Stok otomatis', highlight: 'otomatis', sub: 'dikasih tahu kalau mau habis' },
  { id: 'weight', title: 'Jual per kilo', highlight: 'kilo', sub: 'laundry, sembako, daging' },
  { id: 'debt', title: 'Hutang pelanggan', highlight: 'Hutang', sub: 'tercatat & bisa dicicil' },
  { id: 'profit', title: 'Laba rugi', highlight: 'Laba', sub: 'omset − modal (HPP)' },
  { id: 'report', title: 'Omset naik?', highlight: 'naik?', sub: '▲ 12% minggu ini' },
  { id: 'offline', title: 'Internet mati?', highlight: 'mati?', sub: 'tetap bisa jualan' }
]
const FEATURES_FROM = 400

export const BEATS: Beat[] = [
  { id: 'problems', from: 8, to: 186 },
  { id: 'montage', from: 188, to: 392 },
  ...FEATURES.map((f, i) => ({ ...f, from: FEATURES_FROM + i * FEATURE_LEN, to: FEATURES_FROM + (i + 1) * FEATURE_LEN - 8 })),
  { id: 'extras', from: 1525, to: 1615, title: 'Masih banyak lagi', highlight: 'banyak' },
  { id: 'cta', from: 1620, to: 1800 }
]

const byId = Object.fromEntries(BEATS.map(b => [b.id, b])) as Record<string, Beat>
export const L = byId as Record<
  'problems' | 'montage' | 'scan' | 'pay' | 'print' | 'stock' | 'weight' | 'debt' | 'profit' | 'report' | 'offline' | 'extras' | 'cta',
  Beat
>
export const FEATURE_IDS = FEATURES.map(f => f.id)

/** Frame at a share (0..1) of a beat. */
export const at = (beat: { from: number; to: number }, share: number) => Math.round(beat.from + (beat.to - beat.from) * share)

// Screen windows overlap the neighbours so every change is carried by a whip pan
const screenWin = (id: string, i: number) => {
  const next = FEATURES[i + 1] ? byId[FEATURES[i + 1].id] : byId.extras
  return { from: byId[id].from - (i === 0 ? 14 : 8), to: next.from + 4 }
}
const SCREENS = Object.fromEntries(FEATURE_IDS.map((id, i) => [id, screenWin(id, i)])) as Record<string, { from: number; to: number }>

export const ACT = {
  problems: { from: 0, to: L.montage.from + 18 },
  stage: { from: L.montage.from - 2, to: TOTAL },
  montage: { from: L.montage.from, to: L.montage.to + 10 },
  phone: { from: L.scan.from - 14, to: L.cta.from + 22 },
  extras: { from: L.extras.from - 8, to: L.cta.from + 22 },
  ending: { from: L.cta.from - 2, to: TOTAL },
  ...SCREENS
} as Record<string, { from: number; to: number }>

// Konten penting dijaga di y 250–1590 (atas: nama akun, bawah: kolom balas story)
