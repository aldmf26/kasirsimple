import { useGlobalFrame } from '../utils/frame'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { KineticText } from '../components/KineticText'
import { PaperScrap, Scrap } from '../components/PaperScrap'
import { colors } from '../theme'
import { easeIn, easeOut, POP, springAt, tween } from '../utils/animations'
import { FLAP_Y, LOGO_PX, walletState } from '../utils/wallet'

// Isi bon dari menu data demo app (kopi, teh tarik, nasi goreng, donut…)
const SCRAPS: Scrap[] = [
  { x: 330, y: 220, w: 380, rot: -8, land: 0, lines: ['Kopi 2 × 10rb', 'Teh tarik 3'] },
  { x: 1570, y: 200, w: 400, rot: 6, land: 0, lines: ['Total hari ini', '1.2??.000 ?'], strike: [1], strikeAt: 40 },
  { x: 270, y: 830, w: 380, rot: 5, land: 0, lines: ['Kembalian', 'berapa ya?'] },
  { x: 1640, y: 850, w: 360, rot: -5, land: 0, lines: ['Stok mie ??', 'cek gudang'] },
  { x: 780, y: 120, w: 360, rot: 4, land: 5, lines: ['Nasi goreng 35rb'], strike: [0], strikeAt: 30 },
  { x: 1180, y: 960, w: 340, rot: -7, land: 10, lines: ['Donut 4 = 23rb?'], strike: [0], strikeAt: 52 },
  { x: 720, y: 960, w: 340, rot: 8, land: 16, lines: ['Jus jeruk 15rb'] },
  { x: 1260, y: 110, w: 340, rot: -4, land: 22, lines: ['Bon belum', 'dihitung'] },
  { x: 120, y: 530, w: 280, rot: -10, land: 28, lines: ['Keripik 12rb'] }
]

const CALC_DIGITS = ['1.245.0', '1.254.0', '1.24?.0', '1.452.0', '12.45.0', '1.245.0']

const Calculator: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ width: 250, padding: 18, borderRadius: 28, background: '#2B2F36', boxShadow: '0 20px 30px rgba(0,0,0,0.25)' }}>
    <div
      style={{
        height: 78,
        borderRadius: 12,
        background: '#B9C7A6',
        fontFamily: 'Courier New, monospace',
        fontSize: 46,
        fontWeight: 700,
        color: '#2B3326',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 14px'
      }}
    >
      {CALC_DIGITS[Math.floor(frame / 5) % CALC_DIGITS.length]}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ height: 34, borderRadius: 8, background: i === 11 ? '#E67E22' : '#454B55', opacity: Math.floor(frame / 4) % 12 === i ? 0.55 : 1 }} />
      ))}
    </div>
  </div>
)

const CALC: Scrap = { x: 1760, y: 520, w: 250, rot: 9, land: 34, lines: [] }

export const HookScene: React.FC = () => {
  const frame = useGlobalFrame()
  const { fps } = useVideoConfig()

  // kamera: dibuka close-up lalu mundur, getar kecil yang mereda
  const camScale = tween(frame, [0, 74], [1.28, 1], easeOut)
  const shake = tween(frame, [0, 60], [1, 0.25])
  const shx = Math.sin(frame * 1.7) * 4 * shake
  const shy = Math.cos(frame * 2.3) * 3 * shake

  const wallet = walletState(frame, fps)
  const flapY = wallet.cy + (FLAP_Y - LOGO_PX / 2) * wallet.scale

  const objects = [...SCRAPS.map((s, i) => ({ s, i, calc: false })), { s: CALC, i: 9, calc: true }]

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${shx}px, ${shy}px) scale(${camScale})` }}>
        {objects.map(({ s, i, calc }) => {
          // mendarat (land=0 sudah ada di frame pertama: in media res)
          const l = s.land === 0 ? 1 : springAt(frame, s.land, fps, POP)
          const jitterR = Math.sin(frame * 0.11 + i * 1.7) * 2.5
          const jitterY = Math.sin(frame * 0.07 + i) * 8
          // disedot ke tepi atas dompet yang naik
          const sk = tween(frame, [86 + i * 1.3, 100 + i * 1.3], [0, 1], easeIn)
          if (sk >= 1 || l <= 0) return null
          const tx = 960 + (s.x - 960) * 0.2
          const x = s.x + (tx - s.x) * sk
          const y = s.y + jitterY + (flapY - s.y - jitterY) * sk
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${s.rot * (2 - l) + jitterR + sk * 60 * (i % 2 ? 1 : -1)}deg) scale(${(1.25 - 0.25 * l) * (1 - 0.75 * sk)})`,
                opacity: Math.min(1, l * 2),
                filter: `drop-shadow(0 ${10 + 6 * (1 - l)}px 14px rgba(60,45,20,0.18))`
              }}
            >
              {calc ? <Calculator frame={frame} /> : <PaperScrap s={s} i={i} frame={frame} />}
            </div>
          )
        })}
      </AbsoluteFill>

      {/* kantong teks di tengah, di luar rig kamera supaya tetap tajam */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <KineticText
          words={[{ text: 'Masih' }, { text: 'catat' }, { text: 'di' }, { text: 'kertas?', color: colors.logoDeep }]}
          start={12}
          stagger={6}
          exit={84}
          size={124}
          color={colors.ink}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
