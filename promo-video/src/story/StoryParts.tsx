import { AbsoluteFill, Html5Audio, Img, Sequence, spring, staticFile } from 'remotion'
import { KineticText } from '../components/KineticText'
import { colors, fonts } from '../theme'
import { easeOut, tween } from '../utils/animations'
import { useGlobalFrame } from '../utils/frame'
import { Burst, LightSweep } from './fx'
import { PHONE, PHONE_HITS } from './StoryPhone'
import { ACT, at, FPS, L, LINES, TOTAL } from './timeline'

/** Blue stage behind the phone; opens as a circle from the phone's centre (match cut from paper). */
export const PhoneStage: React.FC = () => {
  const frame = useGlobalFrame()
  if (frame < ACT.phone.from - 2) return null
  const open = tween(frame, [ACT.phone.from - 2, ACT.phone.from + 16], [0, 1], easeOut)
  const drift = frame * 0.6
  return (
    <AbsoluteFill style={{ clipPath: `circle(${open * 140}% at 50% 62%)`, background: `linear-gradient(170deg, ${colors.primary600} 0%, ${colors.logoDeep} 70%, #0B2A7A 100%)` }}>
      <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', left: -300 + Math.sin(drift / 40) * 60, top: 200, background: 'radial-gradient(circle, rgba(240,198,36,0.28), transparent 65%)' }} />
      <div style={{ position: 'absolute', width: 1000, height: 1000, borderRadius: '50%', right: -420, top: 1100 + Math.cos(drift / 50) * 50, background: 'radial-gradient(circle, rgba(14,126,254,0.55), transparent 65%)' }} />
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 2px, transparent 2px)', backgroundSize: '44px 44px', backgroundPosition: `0 ${drift}px` }} />
    </AbsoluteFill>
  )
}

/** Big burned-in captions for the phone acts (most stories are watched muted). */
export const Captions: React.FC = () => {
  const frame = useGlobalFrame()
  const line = LINES.find(l => ['debt', 'stock', 'offline', 'report'].includes(l.id) && frame >= l.from - 4 && frame <= l.to + 6)
  if (!line) return null
  const words = line.text.split(' ')
  const inP = tween(frame, [line.from - 4, line.from + 6], [0, 1], easeOut)
  const outP = tween(frame, [line.to, line.to + 6], [0, 1])
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 270, height: 180, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', columnGap: 16, rowGap: 6, opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * 24}px)` }}>
      {words.map((w, i) => {
        const wAt = line.from + ((line.to - line.from) * i) / words.length
        const active = frame >= wAt
        const pop = spring({ frame: frame - wAt, fps: FPS, config: { damping: 12, stiffness: 260, mass: 0.5 } })
        return (
          <span key={i} style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 64, lineHeight: 1.1, letterSpacing: '-0.02em', color: active ? colors.logoYellow : 'rgba(255,255,255,0.55)', transform: `scale(${active ? 0.92 + pop * 0.08 : 0.92})`, textShadow: '0 6px 18px rgba(0,0,0,0.35)', display: 'inline-block' }}>
            {w}
          </span>
        )
      })}
    </div>
  )
}

/** Phone collapses into the logo; logo, name, tagline and the DM call to action. */
export const Ending: React.FC = () => {
  const frame = useGlobalFrame()
  if (frame < ACT.ending.from) return null
  const logoAt = ACT.phone.to - 4
  const pop = spring({ frame: frame - logoAt, fps: FPS, config: { damping: 9, stiffness: 180, mass: 0.8 } })
  const ctaAt = logoAt + 30
  const cta = spring({ frame: frame - ctaAt, fps: FPS, config: { damping: 12, stiffness: 160 } })
  const breathe = 1 + Math.sin((frame - ctaAt) / 7) * 0.02 * (frame > ctaAt + 15 ? 1 : 0)
  const cx = PHONE.x + PHONE.w / 2
  return (
    <AbsoluteFill>
      <Burst at={logoAt + 2} x={cx} y={820} colors={[colors.logoYellow, '#fff', colors.logoBlue]} count={22} spread={420} size={16} />
      {frame >= logoAt && (
        <Img src={staticFile('logo-kasirok.png')} style={{ position: 'absolute', left: cx - 230, top: 560, width: 460, height: 460, transform: `scale(${pop}) rotate(${(1 - pop) * -20}deg)`, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.35))' }} />
      )}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1010 }}>
        <KineticText words={[{ text: 'KasirOK', weight: 800 }]} start={logoAt + 8} size={150} color="#fff" />
        <KineticText words={[{ text: 'Jualan' }, { text: 'tenang,' }, { text: 'siapa' }, { text: 'pun' }, { text: 'bisa.', color: colors.logoYellow }]} start={logoAt + 16} size={58} color="rgba(255,255,255,0.92)" stagger={3} style={{ marginTop: 10 }} />
      </div>
      {frame >= ctaAt && (
        <div style={{ position: 'absolute', left: 140, right: 140, top: 1340, transform: `scale(${cta * breathe})`, borderRadius: 999, background: colors.logoYellow, color: colors.ink, padding: '30px 0', textAlign: 'center', fontFamily: fonts.display, fontWeight: 800, fontSize: 44, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          Coba gratis · DM @kasir.ok
        </div>
      )}
      <LightSweep at={logoAt + 12} duration={20} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, textAlign: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 30, color: 'rgba(255,255,255,0.8)', opacity: tween(frame, [ctaAt + 10, ctaAt + 22], [0, 1]) }}>
        Bisa offline · Hutang pelanggan · Stok · Laporan
      </div>
    </AbsoluteFill>
  )
}

// ---- audio ------------------------------------------------------------------
// [frame, file, volume]: impacts/whooshes on the cuts, clicks on taps
const SFX: Array<[number, string, number]> = [
  [0, 'impact', 0.35],
  [at(L.hook, 0.42), 'impact', 0.55],
  [at(L.past, 0.05), 'whoosh', 0.7],
  [at(L.past, 0.08), 'paper', 0.6],
  [ACT.phone.from, 'whoosh', 0.6],
  [ACT.phone.from + 10, 'pop', 0.45],
  ...PHONE_HITS.map((f): [number, string, number] => [f, 'click', 0.7]),
  [ACT.stock.from, 'whoosh', 0.4],
  [ACT.offline.from, 'whoosh', 0.4],
  [ACT.report.from, 'whoosh', 0.4],
  [ACT.phone.to - 8, 'suck', 0.6],
  [ACT.phone.to - 4, 'impact', 0.7],
  [ACT.phone.to + 26, 'ding', 0.5]
]

export const StoryAudio: React.FC = () => (
  <>
    {/* Music stays low and dips further while grandma talks, so every word is clear */}
    <Html5Audio
      src={staticFile('audio/music-placeholder.wav')}
      loop
      volume={f => {
        const speaking = LINES.some(l => f >= l.from - 4 && f <= l.to + 4)
        const fadeOut = f > TOTAL - 30 ? (TOTAL - f) / 30 : 1
        return (speaking ? 0.07 : 0.16) * fadeOut
      }}
    />
    {LINES.map(l => (
      <Sequence key={l.id} from={l.from} layout="none">
        <Html5Audio src={staticFile(l.file)} volume={1} />
      </Sequence>
    ))}
    {SFX.map(([f, name, vol], i) => (
      <Sequence key={i} from={Math.max(0, f)} layout="none">
        <Html5Audio src={staticFile(`audio/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
)

