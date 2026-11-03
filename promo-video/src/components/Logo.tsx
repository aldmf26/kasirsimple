import { Img, staticFile } from 'remotion'
import { LOGO_PX } from '../utils/wallet'

/** Logo asli KasirOK (public/images/logo-kasirok.png), diposisikan dari titik tengahnya */
export const Logo: React.FC<{ cx: number; cy: number; scale: number; squash?: number; opacity?: number }> = ({ cx, cy, scale, squash = 1, opacity = 1 }) => (
  <Img
    src={staticFile('logo-kasirok.png')}
    style={{
      position: 'absolute',
      left: cx - LOGO_PX / 2,
      top: cy - LOGO_PX / 2,
      width: LOGO_PX,
      height: LOGO_PX,
      opacity,
      transform: `scale(${scale * (2 - squash)}, ${scale * squash})`,
      transformOrigin: '50% 50%',
      filter: 'drop-shadow(0 18px 24px rgba(1,76,204,0.18))'
    }}
  />
)
