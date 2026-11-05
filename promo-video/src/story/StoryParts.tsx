import { AbsoluteFill, Html5Audio, Img, Sequence, spring, staticFile } from 'remotion'
import { KineticText } from '../components/KineticText'
import { colors, fonts } from '../theme'
import { easeIn, easeOut, tween } from '../utils/animations'
import { useGlobalFrame } from '../utils/frame'
import { Burst, LightSweep } from './fx'
import { shakeAt } from './fx'
import { PROBLEMS, problemAt, stampAt } from './ProblemsAct'
import { PHONE, PHONE_HITS, PHONE_MOMENTS } from './StoryPhone'
import { ACT, BEATS, FEATURE_IDS, FPS, L, TOTAL } from './timeline'

/** Blue stage behind the phone; opens as a circle from the phone's centre (match cut from paper). */
export const PhoneStage: React.FC = () => {
  const frame = useGlobalFrame()
  if (frame < ACT.stage.from) return null
  const open = tween(frame, [ACT.stage.from, ACT.stage.from + 18], [0, 1], easeOut)
  const drift = frame * 0.6
  return (
    <AbsoluteFill style={{ clipPath: `circle(${open * 140}% at 50% 50%)`, background: `linear-gradient(170deg, ${colors.primary600} 0%, ${colors.logoDeep} 70%, #0B2A7A 100%)` }}>
      <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', left: -300 + Math.sin(drift / 40) * 60, top: 200, background: 'radial-gradient(circle, rgba(240,198,36,0.28), transparent 65%)' }} />
      <div style={{ position: 'absolute', width: 1000, height: 1000, borderRadius: '50%', right: -420, top: 1100 + Math.cos(drift / 50) * 50, background: 'radial-gradient(circle, rgba(14,126,254,0.55), transparent 65%)' }} />
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 2px, transparent 2px)', backgroundSize: '44px 44px', backgroundPosition: `0 ${drift}px` }} />
    </AbsoluteFill>
  )
}


// ---- business montage ---------------------------------------------------------
export const BUSINESSES: Array<[string, string, string]> = [
  ['🛒', 'Sembako', 'stok & timbangan'],
  ['📱', 'Konter HP', 'kartu, sparepart, casan'],
  ['🔧', 'Bengkel', 'jasa + sparepart'],
  ['💈', 'Barbershop', 'jasa cukur'],
  ['🧺', 'Laundry', 'kiloan per kg'],
  ['🍛', 'Rumah makan', 'menu & pesanan'],
  ['☕', 'Kafe kopi', 'cepat saat ramai']
]
const TILE = { w: 460, h: 236, gap: 26, left: 67, top: 486 }
export const tileAt = (i: number) => L.montage.from + 26 + i * 21

/** "Cocok buat usaha apa aja": seven business cards slam onto the blue stage. */
export const Montage: React.FC = () => {
  const frame = useGlobalFrame()
  if (frame < ACT.montage.from || frame > ACT.montage.to) return null
  const titleIn = spring({ frame: frame - L.montage.from - 4, fps: FPS, config: { damping: 12, stiffness: 170 } })
  const exit = tween(frame, [L.montage.to - 14, L.montage.to + 6], [0, 1], easeIn)
  const shake = shakeAt(frame, BUSINESSES.map((_, i) => tileAt(i)), 10)
  return (
    <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 262, textAlign: 'center', fontFamily: fonts.display, fontWeight: 800, fontSize: 92, lineHeight: 1.02, letterSpacing: '-0.035em', color: '#fff', transform: `translateY(${(1 - titleIn) * -80 - exit * 120}px) scale(${0.7 + titleIn * 0.3})`, opacity: Math.min(1, titleIn * 1.4) * (1 - exit), textShadow: '0 10px 28px rgba(0,0,0,0.35)' }}>
        Cocok buat usaha<br /><span style={{ color: colors.logoYellow }}>apa aja</span>
      </div>
      {BUSINESSES.map(([icon, name, desc], i) => {
        const t0 = tileAt(i)
        if (frame < t0 - 2) return null
        const slam = spring({ frame: frame - t0, fps: FPS, config: { damping: 13, stiffness: 260, mass: 0.7 } })
        const col = i % 2
        const row = Math.floor(i / 2)
        const lastAlone = i === BUSINESSES.length - 1 && BUSINESSES.length % 2 === 1
        const x = lastAlone ? (1080 - TILE.w) / 2 : TILE.left + col * (TILE.w + TILE.gap)
        const y = TILE.top + row * (TILE.h + TILE.gap)
        // exit: every card is sucked into the centre, where the phone rises
        const ex = (540 - (x + TILE.w / 2)) * exit
        const ey = (1040 - (y + TILE.h / 2)) * exit
        return (
          <div key={name} style={{ position: 'absolute', left: x, top: y, width: TILE.w, height: TILE.h, borderRadius: 34, background: '#fff', boxShadow: '0 24px 50px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px', transform: `translate(${ex}px, ${ey}px) scale(${(2.1 - slam * 1.1) * (1 - exit * 0.85)}) rotate(${(1 - slam) * (col ? 14 : -14)}deg)`, opacity: Math.min(1, slam * 2) * (1 - exit * 0.9) }}>
            <div style={{ fontSize: 100, lineHeight: 1 }}>{icon}</div>
            <div>
              <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 48, color: colors.ink, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{name}</div>
              <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 25, color: colors.gray500, marginTop: 6 }}>{desc}</div>
            </div>
          </div>
        )
      })}
      {BUSINESSES.map((_, i) => <Burst key={i} at={tileAt(i)} x={540} y={TILE.top + Math.floor(i / 2) * (TILE.h + TILE.gap) + TILE.h / 2} colors={[colors.logoYellow, '#fff']} count={8} spread={300} size={10} />)}
    </AbsoluteFill>
  )
}

// ---- "masih banyak lagi" chips ------------------------------------------------
const EXTRAS: Array<[string, number, number]> = [
  ['Shift kasir', 70, 560],
  ['PIN owner', 700, 640],
  ['Data pelanggan', 40, 820],
  ['Pengeluaran', 730, 900],
  ['Diskon & pajak', 60, 1080],
  ['Backup data', 720, 1160],
  ['Export Excel/PDF', 120, 1330]
]

const chipAt = (i: number) => L.extras.from + i * 7

/** Feature chips fly in around the phone during "Masih banyak lagi". */
export const Extras: React.FC = () => {
  const frame = useGlobalFrame()
  if (frame < ACT.extras.from || frame > L.cta.from + 4) return null
  const out = tween(frame, [L.cta.from - 10, L.cta.from + 4], [0, 1], easeIn)
  return (
    <AbsoluteFill>
      {EXTRAS.map(([label, x, y], i) => {
        const t0 = chipAt(i)
        const pop = spring({ frame: frame - t0, fps: FPS, config: { damping: 11, stiffness: 220, mass: 0.6 } })
        if (frame < t0) return null
        const fromX = x < 400 ? -500 : 700
        const bob = Math.sin((frame + i * 13) / 10) * 8
        return (
          <div key={label} style={{ position: 'absolute', left: x, top: y + bob, padding: '18px 30px', borderRadius: 999, background: i % 2 ? colors.logoYellow : '#fff', color: colors.ink, fontFamily: fonts.display, fontWeight: 800, fontSize: 40, boxShadow: '0 16px 34px rgba(0,0,0,0.3)', transform: `translateX(${(1 - pop) * fromX}px) scale(${(0.6 + pop * 0.4) * (1 - out)}) rotate(${(i % 2 ? 3 : -3) * pop}deg)`, opacity: 1 - out, whiteSpace: 'nowrap', zIndex: 5 }}>
            ✓ {label}
          </div>
        )
      })}
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
  ...PROBLEMS.flatMap((_, i): Array<[number, string, number]> => [[problemAt(i), 'whoosh', 0.35], [stampAt(i), 'impact', 0.6]]),
  [problemAt(PROBLEMS.length) + 2, 'pop', 0.5],
  [ACT.stage.from, 'whoosh', 0.6],
  ...BUSINESSES.map((_, i): [number, string, number] => [tileAt(i), 'impact', 0.42]),
  [L.montage.to - 12, 'suck', 0.5],
  [ACT.phone.from, 'whoosh', 0.6],
  [ACT.phone.from + 10, 'pop', 0.45],
  ...PHONE_HITS.map((f): [number, string, number] => [f, 'click', 0.7]),
  [PHONE_MOMENTS.scanBeep1, 'tick', 0.8],
  [PHONE_MOMENTS.scanBeep2, 'tick', 0.8],
  [PHONE_MOMENTS.payChange, 'ding', 0.45],
  [PHONE_MOMENTS.printFeed, 'printer', 0.6],
  [PHONE_MOMENTS.profitLaba, 'ding', 0.45],
  ...FEATURE_IDS.slice(1).map((id): [number, string, number] => [ACT[id].from, 'whoosh', 0.35]),
  [ACT.extras.from, 'whoosh', 0.45],
  ...EXTRAS.map((_, i): [number, string, number] => [chipAt(i), 'pop', 0.3]),
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
