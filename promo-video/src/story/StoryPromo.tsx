import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { GlobalFrame } from '../utils/frame'
import { Grain } from './fx'
import { NotebookAct } from './NotebookAct'
import { StoryPhone } from './StoryPhone'
import { Ending, Headline, PhoneStage, StoryAudio } from './StoryParts'
import { ACT } from './timeline'

/**
 * KasirOK — story 9:16, 30 dtk, tanpa suara: teks besar + efek + musik.
 * Buku utang (hook) → halaman dilempar → HP muncul dari serpihan → hutang, stok,
 * offline, laporan → HP mengecil masuk ke logo. Urutan render = kedalaman.
 */
export const StoryPromo: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <GlobalFrame.Provider value={frame}>
      <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
        {frame <= ACT.notebook.to && <NotebookAct />}
        <PhoneStage />
        <Headline />
        <StoryPhone />
        <Ending />
        <Grain />
        <StoryAudio />
      </AbsoluteFill>
    </GlobalFrame.Provider>
  )
}
