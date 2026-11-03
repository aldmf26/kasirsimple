import { spring } from 'remotion'
import { easeInOut, SOFT, tween } from './animations'
import { T } from './timing'

// Titik penting di dalam logo-kasirok.png (500×500), diukur dari gambar
export const LOGO_PX = 500
export const BADGE = { cx: 241, cy: 334, w: 138, h: 132, r: 20 } // kotak kuning mesin kasir
export const FLAP_Y = 118 // tepi atas badan dompet

/**
 * Lintasan dompet logo dari babak hook sampai push ke badge.
 * Dipakai bersama oleh kertas (tujuan sedotan), logo, dan mask transisi.
 */
export const walletState = (frame: number, fps: number) => {
  if (frame < T.walletCover) {
    // naik dari bawah dalam skala raksasa sampai menutup frame
    return { cx: 960, cy: tween(frame, [T.walletRise, T.walletCover], [1760, 560], easeInOut), scale: 6 }
  }
  const p = spring({ frame: frame - T.walletCover, fps, config: SOFT })
  const land = { cx: 960 + (580 - 960) * p, cy: 560 + (540 - 560) * p, scale: 6 * Math.pow(1.3 / 6, p) }
  if (frame < T.badgePush) return land

  // kamera menembus badge kuning: badge digeser ke tengah frame sambil membesar
  const q = tween(frame, [T.badgePush, T.maskStart], [0, 1], easeInOut)
  const scale = land.scale * Math.pow(3.2 / land.scale, q)
  const ox = BADGE.cx - LOGO_PX / 2
  const oy = BADGE.cy - LOGO_PX / 2
  const bx = land.cx + ox * land.scale + (960 - (land.cx + ox * land.scale)) * q
  const by = land.cy + oy * land.scale + (540 - (land.cy + oy * land.scale)) * q
  return { cx: bx - ox * scale, cy: by - oy * scale, scale }
}

export const badgeRect = (w: { cx: number; cy: number; scale: number }) => {
  const cx = w.cx + (BADGE.cx - LOGO_PX / 2) * w.scale
  const cy = w.cy + (BADGE.cy - LOGO_PX / 2) * w.scale
  return { x: cx - (BADGE.w * w.scale) / 2, y: cy - (BADGE.h * w.scale) / 2, w: BADGE.w * w.scale, h: BADGE.h * w.scale, r: BADGE.r * w.scale }
}
