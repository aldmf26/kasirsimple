// Story 9:16, 30 dtk, tanpa suara: teks besar + efek. Semua waktu = frame global.
export const FPS = 30
export const W = 1080
export const H = 1920
export const TOTAL = 900

export type Beat = { id: string; from: number; to: number; title?: string; highlight?: string; sub?: string }

// Each beat = one message on screen. Phone beats carry their headline text.
export const BEATS: Beat[] = [
  { id: 'hook', from: 8, to: 105 },
  { id: 'past', from: 114, to: 212 },
  { id: 'debt', from: 221, to: 376, title: 'Hutang pelanggan', highlight: 'Hutang', sub: 'tercatat & bisa dicicil' },
  { id: 'stock', from: 385, to: 485, title: 'Stok mau habis?', highlight: 'habis?', sub: 'langsung dikasih tahu' },
  { id: 'offline', from: 494, to: 598, title: 'Internet mati?', highlight: 'mati?', sub: 'tetap bisa jualan' },
  { id: 'report', from: 607, to: 708, title: 'Laporan jelas', highlight: 'jelas', sub: '▲ 12% minggu ini' },
  { id: 'cta', from: 717, to: 818 }
]

const byId = Object.fromEntries(BEATS.map(b => [b.id, b])) as Record<string, Beat>
export const L = {
  hook: byId.hook,
  past: byId.past,
  debt: byId.debt,
  stock: byId.stock,
  offline: byId.offline,
  report: byId.report,
  cta: byId.cta
}

/** Frame at a share (0..1) of a beat. */
export const at = (beat: { from: number; to: number }, share: number) => Math.round(beat.from + (beat.to - beat.from) * share)

// Rentang tampil tiap babak (beririsan agar perpindahan dibawa gerak, bukan potong)
export const ACT = {
  notebook: { from: 0, to: L.past.to + 8 },
  phone: { from: L.debt.from - 14, to: L.cta.from + 22 },
  debt: { from: L.debt.from - 14, to: L.stock.from + 4 },
  stock: { from: L.stock.from - 8, to: L.offline.from + 4 },
  offline: { from: L.offline.from - 8, to: L.report.from + 4 },
  report: { from: L.report.from - 8, to: L.cta.from + 22 },
  ending: { from: L.cta.from - 2, to: TOTAL }
}

// Safe area story (atas: nama akun, bawah: kolom balas) — konten penting di dalam sini
export const SAFE_TOP = 250
export const SAFE_BOTTOM = H - 330
