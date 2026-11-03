// Membuat semua efek suara + musik placeholder secara prosedural (tanpa aset pihak ketiga,
// bebas lisensi). Deterministik: noise dari LCG berbiji tetap. Jalankan: npm run sfx
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 44100
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio')
mkdirSync(OUT, { recursive: true })

let seed = 1234567
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1
const TAU = Math.PI * 2

const writeWav = (name, ch) => {
  const n = ch[0].length
  const buf = Buffer.alloc(44 + n * 4)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const v = Math.max(-1, Math.min(1, ch[c][i]))
      buf.writeInt16LE(Math.round(v * 32767), 44 + i * 4 + c * 2)
    }
  }
  writeFileSync(join(OUT, name), buf)
  console.log('wrote', name, (n / SR).toFixed(2) + 's')
}

const mono = (secs, fn) => {
  const a = new Float32Array(Math.round(secs * SR))
  for (let i = 0; i < a.length; i++) a[i] = fn(i / SR, i)
  return [a, a]
}
const normalize = (ch, peak) => {
  let m = 0
  for (const a of ch) for (const v of a) m = Math.max(m, Math.abs(v))
  return ch.map(a => a.map(v => (v / (m || 1)) * peak))
}

// one-pole lowpass dengan cutoff yang bisa berubah per sampel
const lowpass = () => {
  let y = 0
  return (x, hz) => (y += (1 - Math.exp((-TAU * hz) / SR)) * (x - y))
}

// whoosh: noise tersaring, cutoff menyapu naik-turun
const whoosh = (dur, rev = false) => {
  const lp = lowpass(), lp2 = lowpass()
  return normalize(mono(dur, t => {
    const u = rev ? 1 - t / dur : t / dur
    const env = Math.sin(Math.PI * Math.pow(u, rev ? 0.5 : 0.7)) ** 2
    const hz = 300 + 3200 * Math.sin(Math.PI * u)
    const n = noise()
    return (lp(n, hz) - lp2(n, hz * 0.25)) * env
  }), 0.8)
}

writeWav('whoosh.wav', whoosh(0.55))
writeWav('suck.wav', whoosh(0.5, true))

writeWav('impact.wav', normalize(mono(0.9, t => {
  const f = 38 + 50 * Math.exp(-t * 18)
  return Math.sin(TAU * f * t + 2 * Math.exp(-t * 30)) * Math.exp(-t * 5) + noise() * Math.exp(-t * 60) * 0.4
}), 0.9))

writeWav('click.wav', normalize(mono(0.07, t => Math.sin(TAU * 2100 * t) * Math.exp(-t * 90) + noise() * Math.exp(-t * 400) * 0.3), 0.55))

writeWav('pop.wav', normalize(mono(0.18, t => {
  const f = 380 + 700 * Math.min(1, t / 0.05)
  return Math.sin(TAU * f * t) * Math.exp(-t * 28)
}), 0.6))

writeWav('tick.wav', normalize(mono(0.05, t => Math.sin(TAU * 3200 * t) * Math.exp(-t * 140)), 0.35))

{
  const lp = lowpass()
  writeWav('paper.wav', normalize(mono(0.22, t => lp(noise(), 2400) * Math.exp(-t * 18) * (0.6 + 0.4 * Math.sin(TAU * 40 * t))), 0.45))
}

// printer thermal: dengung motor + ketukan baris ±30 Hz
writeWav('printer.wav', normalize(mono(1.0, t => {
  const env = Math.min(1, t / 0.04) * Math.min(1, (1 - t) / 0.08)
  const motor = Math.sign(Math.sin(TAU * 118 * t)) * 0.25
  const step = Math.exp(-((t * 30) % 1) * 9) * noise()
  return (motor * 0.5 + step) * env
}), 0.4))

writeWav('ding.wav', normalize(mono(1.4, t => {
  const env = Math.exp(-t * 3.2)
  const env2 = t < 0.09 ? 0 : Math.exp(-(t - 0.09) * 3)
  return (Math.sin(TAU * 1318.5 * t) * 0.6 + Math.sin(TAU * 2637 * t) * 0.15) * env + Math.sin(TAU * 1760 * t) * 0.6 * env2
}), 0.55))

// ---- musik placeholder 20 dtk, 100 BPM (1 ketukan = 18 frame) ----
// Ganti dengan public/audio/music.mp3 berlisensi; lihat README.
{
  const dur = 20, n = dur * SR, beat = 0.6
  const L = new Float32Array(n), R = new Float32Array(n)
  const midi = m => 440 * Math.pow(2, (m - 69) / 12)
  // Fmaj7 – Am7 – Dm9 – Bbmaj7, tiap 2 bar
  const chords = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 64], [46, 53, 57, 62]]
  const bar = beat * 4
  const lpL = lowpass(), lpR = lowpass(), hatLp = lowpass()
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const ci = Math.min(Math.floor(t / (bar * 2)) % 4, 3)
    const chord = t > 17.6 ? chords[0] : chords[ci]
    const tc = t > 17.6 ? t - 17.6 : t % (bar * 2)
    const att = Math.min(1, tc / 0.35)
    const fadeOut = t > 17.6 ? Math.exp(-(t - 17.6) * 1.6) : 1
    let l = 0, r = 0
    for (let k = 0; k < chord.length; k++) {
      const f = midi(chord[k] + 12)
      l += Math.sin(TAU * f * 1.002 * t + k) * 0.18
      r += Math.sin(TAU * f * 0.998 * t + k * 2) * 0.18
    }
    const pad = att * fadeOut * (0.75 + 0.25 * Math.sin(TAU * t / beat))
    l = lpL(l, 1800) * pad
    r = lpR(r, 1800) * pad
    // bas + kick lembut mulai produk muncul (3,4 dtk), hi-hat mulai demo (7 dtk)
    const tb = t % beat
    const live = t > 3.4 && t < 17.6
    const bass = live ? Math.sin(TAU * midi(chord[0] - 12) * t) * Math.exp(-tb * 4) * 0.35 : 0
    const kick = live ? Math.sin(TAU * (45 + 90 * Math.exp(-tb * 30)) * tb) * Math.exp(-tb * 9) * 0.55 : 0
    const th = (t + beat / 2) % beat
    const hat = t > 7 && t < 17.6 ? (noise() - hatLp(noise(), 6000)) * Math.exp(-th * 60) * 0.12 : 0
    L[i] = l + bass + kick + hat
    R[i] = r + bass + kick + hat
  }
  writeWav('music-placeholder.wav', normalize([L, R], 0.7))
}
