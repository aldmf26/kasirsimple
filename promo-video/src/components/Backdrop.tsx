import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { colors } from '../theme'
import { T } from '../utils/timing'

/** Babak masalah: kertas krem bergaris + butiran hidup (seed dari frame, deterministik) */
const PaperBackdrop: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(70% 60% at 50% 45%, #FBF8F2 0%, ${colors.paper} 60%, #E6DDCB 100%)`
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 62px, rgba(14,126,254,0.10) 62px 64px)',
        transform: `translateY(${-(frame * 0.6) % 64}px)`
      }}
    />
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.22, mixBlendMode: 'multiply' }}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(frame / 2)} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  </AbsoluteFill>
)

/** Setelah KasirOK: slate terang + blob warna logo mengambang pelan */
const CleanBackdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const blob = (x: number, y: number, size: number, color: string, phase: number) => (
    <div
      style={{
        position: 'absolute',
        left: x + Math.sin(frame / 55 + phase) * 60,
        top: y + Math.cos(frame / 70 + phase) * 45,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 66%)`
      }}
    />
  )
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #FFFFFF 0%, ${colors.slate50} 45%, #EEF3FA 100%)` }}>
      {blob(-260, -320, 1100, 'rgba(14,126,254,0.16)', 0)}
      {blob(1180, 420, 1000, 'rgba(240,198,36,0.20)', 2)}
      {blob(560, 640, 900, 'rgba(37,99,235,0.09)', 4)}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'multiply' }}>
        <filter id="clean-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed={Math.floor(frame / 2)} />
        </filter>
        <rect width="100%" height="100%" filter="url(#clean-grain)" />
      </svg>
    </AbsoluteFill>
  )
}

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame()
  // pergantian terjadi saat dompet menutup penuh frame (pemicu terlihat)
  return frame < T.walletCover ? <PaperBackdrop frame={frame} /> : <CleanBackdrop frame={frame} />
}
