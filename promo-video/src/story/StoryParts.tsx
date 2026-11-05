import { AbsoluteFill, Html5Audio, Img, Sequence, spring, staticFile } from 'remotion'
import { KineticText } from '../components/KineticText'
import { colors, fonts } from '../theme'
import { easeOut, tween } from '../utils/animations'
import { useGlobalFrame } from '../utils/frame'
import { Burst, LightSweep } from './fx'
import { PHONE, PHONE_HITS } from './StoryPhone'
import { ACT, at, BEATS, FPS, L, TOTAL } from './timeline'

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

/** Big two-level headline above the phone: title words pop in, the sub line gets
 * a yellow marker swipe. This carries the whole message (the story has no voice). */
export const Headline: React.FC = () => {
  const frame = useGlobalFrame()
  const beat = BEATS.find(b => b.title && frame >= b.from - 8 && frame <= b.to + 6)
  if (!beat?.title) return null
  const words = beat.title.split(' ')
  const outP = tween(frame, [beat.to - 2, beat.to + 6], [0, 1])
  const subAt = beat.from + 10
  const sub = spring({ frame: frame - subAt, fps: FPS, config: { damping: 14, stiffness: 180 } })
  const marker = tween(frame, [subAt + 4, subAt + 16], [0, 1], easeOut)
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 228, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 1 - outP, transform: `translateY(${-outP * 30}px)` }}>
      <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
        {words.map((w, i) => {
          const pop = spring({ frame: frame - (beat.from - 6 + i * 4), fps: FPS, config: { damping: 10, stiffness: 230, mass: 0.6 } })
          const hot = w === beat.highlight
          return (
            <span key={i} style={{ display: 'inline-block', fontFamily: fonts.display, fontWeight: 800, fontSize: 96, lineHeight: 1, letterSpacing: '-0.035em', color: hot ? colors.logoYellow : '#fff', transform: `translateY(${(1 - pop) * 60}px) scale(${0.6 + pop * 0.4}) rotate(${(1 - pop) * (i % 2 ? 6 : -6)}deg)`, opacity: Math.min(1, pop * 1.5), textShadow: '0 10px 28px rgba(0,0,0,0.35)' }}>
              {w}
            </span>
          )
        })}
      </div>
      {beat.sub && (
        <div style={{ position: 'relative', padding: '6px 22px', transform: `translateY(${(1 - sub) * 40}px)`, opacity: Math.min(1, sub * 1.4) }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: colors.logoYellow, transform: `scaleX(${marker}) rotate(-1.5deg)`, transformOrigin: 'left center' }} />
          <span style={{ position: 'relative', fontFamily: fonts.display, fontWeight: 800, fontSize: 58, color: marker > 0.5 ? colors.ink : '#fff', letterSpacing: '-0.02em' }}>{beat.sub}</span>
        </div>
      )}
    </div>
  )
}

/** WhatsApp mark: white speech bubble with a handset (drawn, no brand asset file). */
const WhatsAppIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.7 4.8 2 6.8L3.4 29l6.9-1.8c1.7.9 3.7 1.4 5.7 1.4 7.2 0 13-5.6 13-12.6S23.2 3 16 3z" fill="#fff" />
    <path d="M12.2 9.6c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 3.9 1.7 4.2c.2.3 2.9 4.6 7.1 6.2 3.5 1.4 4.2 1.1 5 1 .8-.1 2.4-1 2.8-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5l-2.8-1.4c-.4-.1-.6-.2-.9.2-.3.4-1.1 1.4-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.3-2.2-2.7-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.3-3.2z" fill={colors.whatsapp} />
  </svg>
)

/** Phone collapses into the logo; logo, name, tagline and the WhatsApp call to action. */
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
      <Burst at={logoAt + 2} x={cx} y={700} colors={[colors.logoYellow, '#fff', colors.logoBlue]} count={22} spread={420} size={16} />
      {frame >= logoAt && (
        <Img src={staticFile('logo-kasirok.png')} style={{ position: 'absolute', left: cx - 200, top: 470, width: 400, height: 400, transform: `scale(${pop}) rotate(${(1 - pop) * -20}deg)`, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.35))' }} />
      )}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 870 }}>
        <KineticText words={[{ text: 'KasirOK', weight: 800 }]} start={logoAt + 8} size={140} color="#fff" />
        <KineticText words={[{ text: 'Jualan' }, { text: 'tenang,' }, { text: 'siapa' }, { text: 'pun' }, { text: 'bisa.', color: colors.logoYellow }]} start={logoAt + 16} size={56} color="rgba(255,255,255,0.92)" stagger={3} style={{ marginTop: 8 }} />
      </div>
      {/* WhatsApp CTA: the number is the biggest thing on screen so it can be read/typed */}
      {frame >= ctaAt && (
        <div style={{ position: 'absolute', left: 50, right: 50, top: 1190, transform: `scale(${cta * breathe})`, borderRadius: 44, background: colors.whatsapp, padding: '26px 26px 30px', textAlign: 'center', boxShadow: '0 24px 50px rgba(0,0,0,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: fonts.display, fontWeight: 800, fontSize: 46, color: '#fff' }}>
            <WhatsAppIcon size={58} />
            Coba gratis, chat WhatsApp
          </div>
          <div style={{ marginTop: 16, borderRadius: 28, background: '#fff', padding: '18px 0 16px', fontFamily: fonts.display, fontWeight: 800, fontSize: 96, lineHeight: 1, letterSpacing: '0.01em', color: '#075E54' }}>
            0895 4131 11 053
          </div>
        </div>
      )}
      <LightSweep at={logoAt + 12} duration={20} />
      <LightSweep at={ctaAt + 18} duration={18} />
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
    {/* No voice: music carries the mood, fades out at the end */}
    <Html5Audio
      src={staticFile('audio/music-placeholder.wav')}
      loop
      volume={f => 0.6 * (f > TOTAL - 30 ? (TOTAL - f) / 30 : 1)}
    />
    {SFX.map(([f, name, vol], i) => (
      <Sequence key={i} from={Math.max(0, f)} layout="none">
        <Html5Audio src={staticFile(`audio/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
)
