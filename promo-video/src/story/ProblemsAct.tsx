import { AbsoluteFill, random, spring } from 'remotion'
import { colors, fonts } from '../theme'
import { easeIn, easeOut, tween } from '../utils/animations'
import { useGlobalFrame } from '../utils/frame'
import { shakeAt } from './fx'
import { FPS, L } from './timeline'

// Hook for people who never used a POS: the everyday pains of running a shop on memory.
// Each problem: small lead-in, big question, then a red rubber stamp slams on.
export const PROBLEMS: Array<{ lead: string; big: string; stamp: string; icon: string }> = [
  { lead: 'Jualan tiap hari…', big: 'Omset hari ini?', stamp: 'GA TAU', icon: '💸' },
  { lead: 'Stok barang', big: 'di rak ≠ catatan', stamp: 'SELISIH', icon: '📦' },
  { lead: 'Bulan ini', big: 'Untung atau rugi?', stamp: 'GA TAU', icon: '📉' },
  { lead: 'Pelanggan yang ngutang?', big: 'Siapa aja?', stamp: 'LUPA', icon: '📒' },
  { lead: 'Tutup toko, uang laci', big: 'Kok kurang?', stamp: 'SELISIH', icon: '🧾' }
]

const SLOT = 28 // frames per problem
export const problemAt = (i: number) => L.problems.from + i * SLOT
export const stampAt = (i: number) => problemAt(i) + 12
const finaleAt = () => problemAt(PROBLEMS.length) + 2

export const ProblemsAct: React.FC = () => {
  const frame = useGlobalFrame()
  const shake = shakeAt(frame, PROBLEMS.map((_, i) => stampAt(i)), 22)
  const finale = spring({ frame: frame - finaleAt(), fps: FPS, config: { damping: 11, stiffness: 200, mass: 0.7 } })
  const active = PROBLEMS.findIndex((_, i) => frame >= problemAt(i) && frame < problemAt(i + 1))

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #FFF6E5, ${colors.paper} 55%, #D9CDB4)` }}>
      {/* chaos: receipts and notes drifting through the frame the whole time */}
      {Array.from({ length: 14 }, (_, i) => {
        const speed = 3 + random(`v${i}`) * 4
        const y = ((random(`y${i}`) * 2400 + frame * speed) % 2400) - 300
        const x = random(`x${i}`) * 1000 - 40 + Math.sin((frame + i * 20) / 18) * 30
        const lines = 3 + (i % 3)
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: 150, padding: '14px 14px', background: i % 3 ? '#FFFDF6' : '#FFF4D6', boxShadow: '0 8px 16px rgba(59,58,54,0.15)', transform: `rotate(${random(`r${i}`) * 60 - 30 + frame * (i % 2 ? 0.4 : -0.4)}deg)`, opacity: 0.55 }}>
            {Array.from({ length: lines }, (_, j) => <div key={j} style={{ height: 6, margin: '7px 0', width: `${60 + ((i * 13 + j * 17) % 40)}%`, background: 'rgba(59,58,54,0.35)', borderRadius: 3 }} />)}
          </div>
        )
      })}

      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        {active >= 0 && <Problem i={active} />}

        {/* finale: "Masih ngandelin ingatan?" */}
        {frame >= finaleAt() && (
          <div style={{ position: 'absolute', left: 60, right: 60, top: 780, textAlign: 'center', fontFamily: fonts.display, fontWeight: 800, letterSpacing: '-0.035em', color: colors.paperInk, transform: `scale(${0.5 + finale * 0.5})`, opacity: Math.min(1, finale * 1.6) }}>
            <div style={{ fontSize: 96, lineHeight: 1.02 }}>Masih ngandelin</div>
            <div style={{ fontSize: 170, lineHeight: 1, color: colors.red600 }}>ingatan?</div>
          </div>
        )}
      </AbsoluteFill>

      {/* progress ticks: tells the viewer more pains are coming */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 280, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {PROBLEMS.map((_, i) => (
          <div key={i} style={{ width: 60, height: 10, borderRadius: 5, background: frame >= stampAt(i) ? colors.red600 : 'rgba(59,58,54,0.2)' }} />
        ))}
      </div>
    </AbsoluteFill>
  )
}

const Problem: React.FC<{ i: number }> = ({ i }) => {
  const frame = useGlobalFrame()
  const p = PROBLEMS[i]
  const t0 = problemAt(i)
  const inP = tween(frame, [t0, t0 + 7], [0, 1], easeOut)
  const outP = tween(frame, [t0 + SLOT - 5, t0 + SLOT], [0, 1], easeIn)
  const stamp = spring({ frame: frame - stampAt(i), fps: FPS, config: { damping: 9, stiffness: 320, mass: 0.6 } })
  const dir = i % 2 ? 1 : -1
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 560, textAlign: 'center', transform: `translateX(${(1 - inP) * 300 * dir - outP * 400 * dir}px)`, opacity: inP * (1 - outP), filter: inP < 1 || outP > 0 ? `blur(${(1 - inP) * 8 + outP * 10}px)` : undefined }}>
      <div style={{ fontSize: 210, lineHeight: 1 }}>{p.icon}</div>
      <div style={{ marginTop: 18, fontFamily: fonts.display, fontWeight: 700, fontSize: 60, color: 'rgba(59,58,54,0.75)' }}>{p.lead}</div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 118, lineHeight: 1.02, letterSpacing: '-0.035em', color: colors.paperInk }}>{p.big}</div>
      {frame >= stampAt(i) && (
        <div style={{ display: 'inline-block', marginTop: 70, padding: '10px 44px', border: `10px solid ${colors.red600}`, borderRadius: 22, color: colors.red600, fontFamily: fonts.display, fontWeight: 800, fontSize: 120, letterSpacing: '0.04em', transform: `scale(${Math.max(0.92, 3 - stamp * 2)}) rotate(${-8 + (i % 2) * 14}deg)`, opacity: Math.min(1, stamp * 2) * 0.92, mixBlendMode: 'multiply' }}>
          {p.stamp}
        </div>
      )}
    </div>
  )
}
