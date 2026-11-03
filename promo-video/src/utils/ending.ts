import { spring } from 'remotion'
import { SOFT } from './animations'
import { T } from './timing'
import { FLAP_Y, LOGO_PX } from './wallet'

/** Dompet logo di babak penutup: naik dari bawah, menetap di atas wordmark */
export const endWallet = (frame: number, fps: number) => {
  const p = spring({ frame: frame - (T.endSuck - 6), fps, config: SOFT })
  const cx = 960
  const cy = 1320 + (360 - 1320) * p
  const scale = 0.85
  return { cx, cy, scale, flapX: cx - 5 * scale, flapY: cy + (FLAP_Y - LOGO_PX / 2) * scale }
}
