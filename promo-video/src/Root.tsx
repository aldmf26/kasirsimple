import { Composition } from 'remotion'
import { PosPromo } from './PosPromo'
import { StoryPromo } from './story/StoryPromo'
import { FPS as STORY_FPS, H as STORY_H, TOTAL as STORY_TOTAL, W as STORY_W } from './story/timeline'
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './utils/timing'

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="KasirOKPromo"
      component={PosPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    {/* Story 9:16 (Instagram/WA), 30 dtk, teks besar tanpa suara */}
    <Composition
      id="KasirOKStory"
      component={StoryPromo}
      durationInFrames={STORY_TOTAL}
      fps={STORY_FPS}
      width={STORY_W}
      height={STORY_H}
    />
  </>
)
