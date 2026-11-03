import { colors, fonts } from '../theme'
import { tween } from '../utils/animations'

export type Scrap = { x: number; y: number; w: number; rot: number; land: number; lines: string[]; strike?: number[]; strikeAt?: number }

// tepi sobek: poligon bergerigi deterministik
const torn = (seed: number) => {
  const pts: string[] = []
  for (let i = 0; i <= 12; i++) pts.push(`${(i / 12) * 100}% ${i % 2 ? 0 : 3 + ((seed * 7 + i * 3) % 4)}%`)
  for (let i = 12; i >= 0; i--) pts.push(`${(i / 12) * 100}% ${i % 2 ? 100 : 96 - ((seed * 5 + i * 2) % 4)}%`)
  return `polygon(${pts.join(',')})`
}

export const PaperScrap: React.FC<{ s: Scrap; i: number; frame: number }> = ({ s, i, frame }) => (
  <div
    style={{
      width: s.w,
      padding: '26px 28px',
      background: i % 3 === 0 ? '#FFFDF6' : i % 3 === 1 ? '#FFF8E1' : '#FDFBF7',
      clipPath: torn(i),
      fontFamily: fonts.hand,
      fontSize: 40,
      lineHeight: 1.25,
      color: colors.paperInk
    }}
  >
    {s.lines.map((l, li) => {
      const struck = s.strike?.includes(li)
      const d = struck && s.strikeAt !== undefined ? tween(frame, [s.strikeAt + li * 3, s.strikeAt + li * 3 + 10], [0, 1]) : 0
      return (
        <div key={li} style={{ position: 'relative', whiteSpace: 'nowrap' }}>
          {l}
          {struck && (
            <svg style={{ position: 'absolute', left: -6, top: '52%', overflow: 'visible' }} width="100%" height="10">
              <path
                d={`M0 4 Q ${s.w * 0.4} ${-2 - i} ${s.w * 0.8} 6`}
                stroke="#C0392B"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - d}
              />
            </svg>
          )}
        </div>
      )
    })}
  </div>
)
