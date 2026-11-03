import { Html5Audio, Sequence, staticFile } from 'remotion'
import { HANDOFF } from './PosWindow'
import { T } from '../utils/timing'

// Musik: ganti MUSIC ke 'audio/music.mp3' setelah file berlisensi ditaruh di public/audio/
const MUSIC = 'audio/music-placeholder.wav'

// [frame, file, volume] — disinkronkan ke momen animasi di utils/timing.ts
const CUES: Array<[number, string, number]> = [
  [0, 'impact', 0.5],
  [5, 'paper', 0.5],
  [10, 'paper', 0.45],
  [16, 'paper', 0.5],
  [22, 'paper', 0.4],
  [28, 'paper', 0.45],
  [34, 'impact', 0.3],
  [T.walletRise, 'whoosh', 0.7],
  [T.walletRise + 6, 'suck', 0.6],
  [T.walletCover, 'impact', 0.7],
  [T.revealText, 'tick', 0.5],
  [T.badgePush - 2, 'whoosh', 0.6],
  [T.maskStart + 4, 'pop', 0.5],
  [T.click1, 'click', 0.8],
  [T.click2, 'click', 0.8],
  [T.click3, 'click', 0.8],
  [T.clickBayar, 'click', 0.8],
  [T.modalOpen + 2, 'whoosh', 0.3],
  [T.clickQris, 'click', 0.8],
  [T.clickSelesai, 'click', 0.8],
  [T.success, 'ding', 0.6],
  [HANDOFF + 4, 'printer', 0.55],
  [T.word2 - 2, 'whoosh', 0.35],
  [T.word2 + 14, 'tick', 0.6],
  [T.word2 + 22, 'tick', 0.6],
  [T.word3 - 2, 'whoosh', 0.35],
  [T.endSuck, 'suck', 0.6],
  [T.endGulp, 'impact', 0.75],
  [T.wordmark + 2, 'pop', 0.45],
  [T.cta, 'ding', 0.4]
]

export const Soundtrack: React.FC = () => (
  <>
    <Html5Audio src={staticFile(MUSIC)} volume={0.32} />
    {CUES.map(([at, name, vol], i) => (
      <Sequence key={i} from={at} layout="none">
        <Html5Audio src={staticFile(`audio/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
)
