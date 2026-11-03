import { Easing, interpolate, spring } from 'remotion'

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** interpolate dengan clamp di kedua sisi (default semua animasi di video ini) */
export const tween = (
  frame: number,
  [f0, f1]: [number, number],
  [v0, v1]: [number, number],
  easing: (t: number) => number = Easing.bezier(0.45, 0, 0.2, 1)
) => interpolate(frame, [f0, f1], [v0, v1], { ...clamp, easing })

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1) // masuk tegas
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45) // keluar cepat
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)

// Spring terukur: settle = tanda tangan gerak "dirapikan"
export const SETTLE = { damping: 14, stiffness: 170, mass: 0.9 }
export const SOFT = { damping: 22, stiffness: 120, mass: 1 }
export const POP = { damping: 11, stiffness: 220, mass: 0.7 }

export const springAt = (frame: number, start: number, fps: number, config = SETTLE) =>
  spring({ frame: frame - start, fps, config })

/** Keyframe multi-titik dengan easing per segmen (untuk kamera & kursor) */
export const keyframes = (
  frame: number,
  keys: Array<[number, number]>,
  easing: (t: number) => number = easeInOut
) => {
  if (frame <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i]
    const [f0, v0] = keys[i - 1]
    if (frame <= f1) return interpolate(frame, [f0, f1], [v0, v1], { ...clamp, easing })
  }
  return keys[keys.length - 1][1]
}

/** format sama dengan app/utils/helpers.ts formatCurrency */
export const rupiah = (v: number) => `Rp ${Math.round(v).toLocaleString('id-ID')}`
