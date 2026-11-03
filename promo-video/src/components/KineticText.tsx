import { useGlobalFrame } from '../utils/frame'

import { easeIn, easeOut, tween } from '../utils/animations'
import { fonts } from '../theme'

export type Word = { text: string; color?: string; weight?: number }

type Props = {
  words: Word[]
  start: number
  exit?: number
  stagger?: number
  size?: number
  color?: string
  /** arah masuk: 'up' (naik), 'right' (dari kanan) */
  from?: 'up' | 'right'
  align?: 'center' | 'left'
  style?: React.CSSProperties
}

/**
 * Kata per kata: buram berarah → tajam (motion blur SVG searah gerak), keluar cepat ke atas.
 */
export const KineticText: React.FC<Props> = ({
  words,
  start,
  exit,
  stagger = 5,
  size = 96,
  color = '#0F172A',
  from = 'up',
  align = 'center',
  style
}) => {
  const frame = useGlobalFrame()
  const id = `kt-${start}-${words.map(w => w.text).join('')}`.replace(/[^a-zA-Z0-9-]/g, '')

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.26,
        fontFamily: fonts.display,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.08,
        color,
        ...style
      }}
    >
      {words.map((w, i) => {
        const s = start + i * stagger
        const p = tween(frame, [s, s + 16], [0, 1], easeOut)
        const out = exit === undefined ? 0 : tween(frame, [exit + i * 1.5, exit + 9 + i * 1.5], [0, 1], easeIn)
        const dist = 46 * (1 - p) - 36 * out
        const blur = 14 * (1 - p) + 10 * out
        const tx = from === 'right' ? dist * 1.6 : 0
        const ty = from === 'up' ? dist : 0
        const fid = `${id}-${i}`
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <filter id={fid} x="-30%" y="-60%" width="160%" height="220%">
                <feGaussianBlur stdDeviation={from === 'right' ? `${blur} 0` : `0 ${blur}`} />
              </filter>
            </svg>
            <span
              style={{
                display: 'inline-block',
                opacity: Math.min(p * 1.4, 1) * (1 - out),
                transform: `translate(${tx}px, ${ty}px)`,
                filter: blur > 0.2 ? `url(#${fid})` : undefined,
                color: w.color ?? color,
                fontWeight: w.weight ?? 600
              }}
            >
              {w.text}
            </span>
          </span>
        )
      })}
    </div>
  )
}
