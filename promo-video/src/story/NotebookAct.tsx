import { AbsoluteFill, random } from 'remotion'
import { KineticText } from '../components/KineticText'
import { colors, fonts } from '../theme'
import { easeIn, easeOut, keyframes, tween } from '../utils/animations'
import { useGlobalFrame } from '../utils/frame'
import { Burst, shakeAt } from './fx'
import { at, L, W } from './timeline'

const ENTRIES = [
  { name: 'Bu Ani', amount: '15.000' },
  { name: 'Pak Udin', amount: '20.000' },
  { name: 'Mbak Rina', amount: '7.500' },
  { name: 'Bu Ani', amount: '12.000 ?' },
  { name: 'Mas Joko', amount: '30.000' },
  { name: '???', amount: '5.000' }
]


/**
 * Babak 1-2: buku utang lusuh. Hook = "UTANG" dilingkari merah sambil kamera mendorong
 * masuk; "bukunya hilang" = halaman terlempar keluar, angka luruh jadi serpihan.
 */
export const NotebookAct: React.FC = () => {
  const frame = useGlobalFrame()
  const utangAt = at(L.hook, 0.42)
  const circleAt = utangAt + 4
  const throwAt = at(L.past, 0.05)
  const crumbleAt = at(L.past, 0.5)

  // Camera: slow push during the hook, then a hit when the book is thrown away
  const zoom = keyframes(frame, [[0, 1.18], [L.hook.to, 1.32], [throwAt, 1.36], [throwAt + 14, 1.1]])
  const rot = keyframes(frame, [[0, -3], [L.hook.to, -1.5]])
  const shake = shakeAt(frame, [utangAt, throwAt], 16)

  // Notebook flies off bottom-left, spinning, with a motion smear
  const fly = tween(frame, [throwAt, throwAt + 16], [0, 1], easeIn)
  const bookX = -900 * fly
  const bookY = 700 * fly
  const bookRot = -38 * fly
  const smear = 20 * fly * (1 - fly) * 4

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, #FFF6E5, ${colors.paper} 60%, #E6DCC8)` }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${zoom}) rotate(${rot}deg)`, transformOrigin: '50% 55%' }}>
        {/* Buku */}
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 880,
            width: 780,
            height: 900,
            background: 'repeating-linear-gradient(#FFFDF6 0 70px, #CFE0F5 70px 72px)',
            borderLeft: '6px solid #E9A2A2',
            borderRadius: 14,
            boxShadow: '0 40px 80px rgba(59,58,54,0.28)',
            transform: `translate(${bookX}px, ${bookY}px) rotate(${bookRot}deg)`,
            filter: smear > 0.5 ? `blur(${smear}px)` : undefined,
            padding: '30px 54px',
            fontFamily: fonts.hand,
            color: colors.paperInk,
            overflow: 'hidden'
          }}
        >
          {/* noda kopi */}
          <div style={{ position: 'absolute', right: 40, bottom: 120, width: 190, height: 190, borderRadius: '50%', border: '14px solid rgba(139,94,52,0.18)', filter: 'blur(1.5px)' }} />
          <div style={{ fontSize: 58, fontWeight: 700, height: 72, transform: 'rotate(-1.5deg)' }}>Catatan Utang</div>
          {ENTRIES.map((e, i) => {
            const crumble = tween(frame, [crumbleAt + i * 3, crumbleAt + i * 3 + 14], [0, 1], easeIn)
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 48, height: 72, alignItems: 'center', opacity: 1 - crumble, transform: `translateY(${crumble * 40}px) rotate(${(i % 2 ? 1 : -1) * (0.8 + crumble * 6)}deg)`, filter: crumble > 0 ? `blur(${crumble * 6}px)` : undefined }}>
                <span>{e.name}</span>
                <span style={{ textDecoration: e.amount.includes('?') ? 'line-through' : undefined }}>{e.amount}</span>
              </div>
            )
          })}
          {/* lingkaran merah di judul saat "utang" diucapkan */}
          <svg style={{ position: 'absolute', left: 30, top: 14, overflow: 'visible' }} width="420" height="110">
            <ellipse cx="210" cy="52" rx="200" ry="46" fill="none" stroke={colors.red600} strokeWidth="7" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - tween(frame, [circleAt, circleAt + 12], [0, 1], easeOut)} transform="rotate(-3 210 52)" />
          </svg>
        </div>

        {/* serpihan kertas saat buku dilempar */}
        {Array.from({ length: 9 }, (_, i) => {
          const t = tween(frame, [throwAt + 2, throwAt + 30], [0, 1], easeOut)
          if (t <= 0 || t >= 1) return null
          const x = 540 + (random(`px${i}`) - 0.5) * 900 * t
          const y = 1150 + (random(`py${i}`) - 0.6) * 900 * t + t * t * 400
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 70, height: 46, background: '#FFFDF6', boxShadow: '0 6px 12px rgba(0,0,0,0.12)', transform: `rotate(${random(`pr${i}`) * 360 + t * 300}deg)`, opacity: 1 - t }} />
        })}
      </AbsoluteFill>

      <Burst at={throwAt + 2} x={W / 2} y={1150} colors={['#FFFDF6', '#E9DFC9', '#C0392B']} count={16} spread={420} />

      {/* Hook headline */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 250 }}>
        <KineticText
          words={[{ text: 'Masih' }, { text: 'nyatat' }]}
          start={L.hook.from}
          exit={throwAt - 4}
          size={92}
          color={colors.paperInk}
          stagger={4}
        />
        <KineticText
          words={[{ text: 'UTANG', color: colors.red600, weight: 800 }]}
          start={utangAt}
          exit={throwAt - 4}
          size={196}
          style={{ marginTop: 6, textShadow: '0 10px 30px rgba(220,38,38,0.25)' }}
        />
        <KineticText words={[{ text: 'di' }, { text: 'buku?' }]} start={utangAt + 8} exit={throwAt - 4} size={92} color={colors.paperInk} />
      </div>

      {/* "Bukunya hilang, utangnya ikut hilang" */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 760 }}>
        <KineticText words={[{ text: 'Bukunya' }, { text: 'hilang,' }]} start={throwAt + 4} exit={L.past.to + 2} size={104} color={colors.paperInk} />
        <FallingWord text="utangnya ikut hilang" start={crumbleAt} />
      </div>
    </AbsoluteFill>
  )
}

/** Letters appear, then drop away one by one: the debt "disappears". */
const FallingWord: React.FC<{ text: string; start: number }> = ({ text, start }) => {
  const frame = useGlobalFrame()
  const fallAt = L.past.to - 10
  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: 18, fontFamily: fonts.display, fontWeight: 800, fontSize: 92, color: colors.red600, letterSpacing: '-0.02em' }}>
      {text.split('').map((ch, i) => {
        const inP = tween(frame, [start + i * 0.8, start + i * 0.8 + 10], [0, 1], easeOut)
        const fall = tween(frame, [fallAt + (i * 7) % 11, fallAt + (i * 7) % 11 + 14], [0, 1], easeIn)
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: inP * (1 - fall), transform: `translateY(${(1 - inP) * 30 + fall * 260}px) rotate(${fall * (i % 2 ? 50 : -40)}deg)` }}>
            {ch}
          </span>
        )
      })}
    </div>
  )
}
