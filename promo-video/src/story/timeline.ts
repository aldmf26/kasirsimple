import voice from './voice.json'

// Story 9:16, 30 dtk. Semua waktu = frame global, diturunkan dari durasi suara
// (scripts/make-voice.py), jadi animasi selalu jatuh di kata yang diucapkan.
export const FPS = 30
export const W = 1080
export const H = 1920
export const TOTAL = 900

const LEAD = 8 // jeda sebelum kalimat pertama
const GAP = 9 // napas antar kalimat

export type Line = { id: string; text: string; file: string; duration: number; from: number; to: number }

let cursor = LEAD
export const LINES: Line[] = voice.map(v => {
  const from = cursor
  const to = from + Math.round(v.duration * FPS)
  cursor = to + GAP
  return { ...v, from, to }
})

const byId = Object.fromEntries(LINES.map(l => [l.id, l])) as Record<string, Line>
export const L = {
  hook: byId.hook,
  past: byId.past,
  debt: byId.debt,
  stock: byId.stock,
  offline: byId.offline,
  report: byId.report,
  cta: byId.cta
}

if (LINES[LINES.length - 1].to > TOTAL - 45) {
  throw new Error(`Suara terlalu panjang: selesai di frame ${LINES[LINES.length - 1].to}, maks ${TOTAL - 45}`)
}

/** Frame at a share (0..1) of a spoken line; the voice is slow and even. */
export const at = (line: { from: number; to: number }, share: number) => Math.round(line.from + (line.to - line.from) * share)

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
