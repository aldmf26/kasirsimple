import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { Backdrop } from './components/Backdrop'
import { Soundtrack } from './components/Soundtrack'
import { EndingScene } from './scenes/EndingScene'
import { ExperienceScene } from './scenes/ExperienceScene'
import { HookScene } from './scenes/HookScene'
import { RevealScene } from './scenes/RevealScene'
import { ValueScene } from './scenes/ValueScene'
import { GlobalFrame } from './utils/frame'
import { ENDING, EXPERIENCE, HOOK, REVEAL, VALUE } from './utils/timing'

const span = (r: { from: number; to: number }) => ({ from: r.from, durationInFrames: r.to - r.from })

/**
 * KasirOK — promo 20 dtk. Babak beririsan; tiap perpindahan dibawa benda
 * (dompet menelan kertas, badge jadi jendela, modal jadi struk, kartu masuk dompet).
 * Urutan render = urutan kedalaman.
 */
export const PosPromo: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <GlobalFrame.Provider value={frame}>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Backdrop />
        <Sequence {...span(EXPERIENCE)} layout="none"><ExperienceScene /></Sequence>
        <Sequence {...span(HOOK)} layout="none"><HookScene /></Sequence>
        <Sequence {...span(REVEAL)} layout="none"><RevealScene /></Sequence>
        <Sequence {...span(VALUE)} layout="none"><ValueScene /></Sequence>
        <Sequence {...span(ENDING)} layout="none"><EndingScene /></Sequence>
        <Soundtrack />
      </AbsoluteFill>
    </GlobalFrame.Provider>
  )
}
