import { AbsoluteFill, random } from 'remotion'
import { useGlobalFrame } from '../utils/frame'
import { tween } from '../utils/animations'
import { H, W } from './timeline'

/** Camera shake that decays after each hit frame (impacts, taps, the wifi break). */
export const shakeAt = (frame: number, hits: number[], strength = 14) => {
  let x = 0
  let y = 0
  for (const h of hits) {
    const t = frame - h
    if (t < 0 || t > 12) continue
    const decay = (1 - t / 12) ** 2
    x += Math.sin(t * 2.7 + h) * strength * decay
    y += Math.cos(t * 3.3 + h) * strength * 0.7 * decay
  }
  return { x, y }
}

/** Film grain + soft vignette over everything: takes the "clean vector" edge off. */
export const Grain: React.FC = () => {
  const frame = useGlobalFrame()
  const seed = frame % 6 // grain moves every frame, pattern repeats so it renders fast
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay' }}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(15,23,42,0.28) 100%)' }} />
    </AbsoluteFill>
  )
}

/** Diagonal light sweep, used on reveals (logo, totals). */
export const LightSweep: React.FC<{ at: number; duration?: number; color?: string }> = ({ at, duration = 18, color = 'rgba(255,255,255,0.55)' }) => {
  const frame = useGlobalFrame()
  if (frame < at || frame > at + duration) return null
  const x = tween(frame, [at, at + duration], [-W * 0.6, W * 1.2])
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -H * 0.2, left: x, width: 220, height: H * 1.4, transform: 'rotate(18deg)', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, filter: 'blur(8px)' }} />
    </AbsoluteFill>
  )
}

/** Burst of small particles from a point (success, badges, paper bits). */
export const Burst: React.FC<{ at: number; x: number; y: number; colors: string[]; count?: number; spread?: number; size?: number }> = ({ at, x, y, colors, count = 18, spread = 260, size = 14 }) => {
  const frame = useGlobalFrame()
  const t = frame - at
  if (t < 0 || t > 28) return null
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = random(`a${at}-${i}`) * Math.PI * 2
        const dist = spread * (0.45 + random(`d${at}-${i}`) * 0.55)
        const p = 1 - (1 - t / 28) ** 3
        const px = x + Math.cos(angle) * dist * p
        const py = y + Math.sin(angle) * dist * p + t * t * 0.18 // a bit of gravity
        const s = size * (0.6 + random(`s${at}-${i}`) * 0.8) * (1 - t / 34)
        return (
          <div key={i} style={{ position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: i % 3 === 0 ? 3 : '50%', background: colors[i % colors.length], opacity: 1 - t / 30, transform: `rotate(${t * 12 + i * 40}deg)` }} />
        )
      })}
    </>
  )
}

/** Short RGB-split flicker for the "internet mati" moment. */
export const Glitch: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useGlobalFrame()
  const t = frame - at
  const on = t >= 0 && t < 10 && t % 3 !== 2
  const dx = on ? (random(`g${frame}`) - 0.5) * 26 : 0
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {on && <div style={{ position: 'absolute', inset: 0, transform: `translateX(${dx}px)`, filter: 'drop-shadow(-6px 0 0 rgba(255,0,80,0.7)) drop-shadow(6px 0 0 rgba(0,200,255,0.7))', opacity: 0.85 }}>{children}</div>}
      <div style={{ position: 'absolute', inset: 0, opacity: on ? 0.6 : 1 }}>{children}</div>
    </div>
  )
}
