import { AbsoluteFill, useVideoConfig } from 'remotion'
import { IconWhatsApp } from '../components/Icons'
import { Logo } from '../components/Logo'
import { CTA_WHATSAPP } from '../data'
import { colors, fonts } from '../theme'
import { easeOut, POP, SETTLE, springAt, tween } from '../utils/animations'
import { endWallet } from '../utils/ending'
import { useGlobalFrame } from '../utils/frame'
import { T } from '../utils/timing'

const LETTERS = 'KasirOK'.split('')

export const EndingScene: React.FC = () => {
  const frame = useGlobalFrame()
  const { fps } = useVideoConfig()
  const w = endWallet(frame, fps)
  const gulp = 1 - 0.07 * Math.sin(Math.PI * tween(frame, [T.endGulp - 2, T.endGulp + 10], [0, 1]))
  // push pelan supaya penutup tidak membeku
  const push = tween(frame, [T.endGulp, 600], [1, 1.045], easeOut)
  const cta = springAt(frame, T.cta, fps, SETTLE)

  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <Logo cx={w.cx} cy={w.cy} scale={w.scale} squash={gulp} />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 590, display: 'flex', justifyContent: 'center', fontFamily: fonts.display, fontSize: 150, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1 }}>
        {LETTERS.map((ch, i) => {
          // huruf berserakan → terkunci lurus (tanda tangan "dirapikan")
          const p = springAt(frame, T.wordmark + i * 2, fps, POP)
          const rot = (i % 2 ? 1 : -1) * (18 + i * 3) * (1 - p)
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: i >= 5 ? colors.logoBlue : colors.ink,
                opacity: Math.min(1, p * 2),
                transform: `translateY(${(1 - p) * (40 + (i % 3) * 20)}px) rotate(${rot}deg)`
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 34px 18px 24px',
            borderRadius: 999,
            background: '#fff',
            boxShadow: '0 24px 50px -20px rgba(15,23,42,0.3), 0 0 0 1px rgba(15,23,42,0.06)',
            fontFamily: fonts.display,
            fontSize: 46,
            fontWeight: 600,
            color: colors.ink,
            opacity: cta,
            transform: `translateY(${(1 - cta) * 30}px) scale(${0.92 + 0.08 * cta})`
          }}
        >
          <IconWhatsApp size={52} color={colors.whatsapp} />
          <span>
            Hubungi <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{CTA_WHATSAPP}</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
