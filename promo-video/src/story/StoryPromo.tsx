import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { GlobalFrame } from '../utils/frame'
import { Grain } from './fx'
import { ProblemsAct } from './ProblemsAct'
import { StoryPhone } from './StoryPhone'
import { Ending, Extras, Headline, Montage, PhoneStage, StoryAudio } from './StoryParts'
import { ACT } from './timeline'

/**
 * KasirOK — story 9:16, 60 dtk, tanpa suara: teks besar + efek + musik.
 * Rentetan masalah kasir manual (hook) → montase 7 jenis usaha → HP: scan, bayar, struk,
 * stok, timbangan, hutang, laba rugi, omset, offline → fitur lain → logo + WhatsApp.
 */
export const StoryPromo: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <GlobalFrame.Provider value={frame}>
      <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
        {frame <= ACT.problems.to && <ProblemsAct />}
        <PhoneStage />
        <Montage />
        <Headline />
        <StoryPhone />
        <Extras />
        <Ending />
        <Grain />
        <StoryAudio />
      </AbsoluteFill>
    </GlobalFrame.Provider>
  )
}
