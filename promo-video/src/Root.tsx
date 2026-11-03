import { Composition } from 'remotion'
import { PosPromo } from './PosPromo'
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './utils/timing'

export const RemotionRoot: React.FC = () => (
  <Composition
    id="KasirOKPromo"
    component={PosPromo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
)
