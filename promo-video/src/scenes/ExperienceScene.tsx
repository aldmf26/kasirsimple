import { useGlobalFrame } from '../utils/frame'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { PosWindow, UI_SCALE, WIN, HANDOFF } from '../components/PosWindow'
import { colors } from '../theme'
import { easeIn, easeInOut, easeOut, tween } from '../utils/animations'
import { T } from '../utils/timing'
import { badgeRect, walletState } from '../utils/wallet'

/**
 * Jendela kasir lahir dari badge kuning logo (mask bentuk brand), dipakai,
 * lalu mundur ke kedalaman saat modal berubah menjadi struk.
 */
export const ExperienceScene: React.FC = () => {
  const frame = useGlobalFrame()
  const { fps } = useVideoConfig()

  // --- mask: rect badge → rect jendela ---
  const m = tween(frame, [T.maskStart + 4, T.maskEnd], [0, 1], easeOut)
  const b = badgeRect(walletState(Math.min(frame, T.maskStart), fps))
  const r = {
    x: b.x + (WIN.x - b.x) * m,
    y: b.y + (WIN.y - b.y) * m,
    w: b.w + (WIN.w - b.w) * m,
    h: b.h + (WIN.h - b.h) * m,
    r: b.r + (28 - b.r) * m
  }
  const masking = frame < T.maskEnd
  const clip = `inset(${r.y - WIN.y}px ${WIN.x + WIN.w - (r.x + r.w)}px ${WIN.y + WIN.h - (r.y + r.h)}px ${r.x - WIN.x}px round ${r.r}px)`
  const yellow = tween(frame, [T.maskStart + 8, T.maskEnd - 2], [1, 0])
  const innerScale = tween(frame, [T.maskStart, T.maskEnd + 10], [1.08, 1], easeOut)

  // --- mundur ke kedalaman (babak value) ---
  const back = tween(frame, [HANDOFF, HANDOFF + 34], [0, 1], easeInOut)
  const gone = tween(frame, [HANDOFF + 2, HANDOFF + 22], [1, 0], easeIn)

  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <div
        style={{
          position: 'absolute',
          left: WIN.x,
          top: WIN.y,
          width: WIN.w,
          height: WIN.h,
          borderRadius: 28,
          overflow: 'hidden',
          clipPath: masking ? clip : undefined,
          boxShadow: masking ? undefined : '0 50px 90px -30px rgba(15,23,42,0.35), 0 0 0 1px rgba(15,23,42,0.06)',
          opacity: gone,
          filter: back > 0 ? `blur(${back * 8}px)` : undefined,
          transform: `translateX(${-460 * back}px) rotateY(${18 * back}deg) scale(${1 - 0.3 * back})`
        }}
      >
        <div style={{ transformOrigin: '50% 50%', transform: `scale(${innerScale})`, width: WIN.w, height: WIN.h }}>
          <div style={{ transformOrigin: '0 0', transform: `scale(${UI_SCALE})` }}>
            <PosWindow />
          </div>
        </div>
        {yellow > 0 && <AbsoluteFill style={{ background: colors.logoYellow, opacity: yellow }} />}
      </div>
    </AbsoluteFill>
  )
}
