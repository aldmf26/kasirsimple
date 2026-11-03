import { useGlobalFrame } from '../utils/frame'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { KineticText } from '../components/KineticText'
import { Logo } from '../components/Logo'
import { colors } from '../theme'
import { tween } from '../utils/animations'
import { T } from '../utils/timing'
import { walletState } from '../utils/wallet'

export const RevealScene: React.FC = () => {
  const frame = useGlobalFrame()
  const { fps } = useVideoConfig()
  const w = walletState(frame, fps)
  // dompet sedikit memipih saat kertas masuk
  const gulp = 1 - 0.05 * Math.sin(Math.PI * tween(frame, [96, 110], [0, 1]))
  const fade = tween(frame, [T.maskStart, T.maskStart + 5], [1, 0])

  return (
    <AbsoluteFill>
      <Logo cx={w.cx} cy={w.cy} scale={w.scale} squash={gulp} opacity={fade} />
      <div style={{ position: 'absolute', left: 980, top: 350, width: 900 }}>
        <KineticText words={[{ text: 'Rapikan' }, { text: 'dengan' }]} start={T.revealText} stagger={6} exit={T.badgePush - 2} size={108} from="right" align="left" color={colors.ink} />
        <KineticText
          words={[{ text: 'KasirOK', color: colors.logoBlue, weight: 800 }]}
          start={T.revealText + 12}
          exit={T.badgePush}
          size={150}
          from="right"
          align="left"
          style={{ marginTop: 6 }}
        />
      </div>
    </AbsoluteFill>
  )
}
