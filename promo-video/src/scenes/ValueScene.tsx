import { AbsoluteFill, useVideoConfig } from 'remotion'
import { KineticText } from '../components/KineticText'
import { HANDOFF, MODAL, SuccessState, UI_SCALE, WIN } from '../components/PosWindow'
import { DashboardCard, ReceiptBody, StockCard, ZIGZAG } from '../components/ProofCards'
import { colors } from '../theme'
import { easeIn, easeInOut, easeOut, SOFT, springAt, tween } from '../utils/animations'
import { endWallet } from '../utils/ending'
import { useGlobalFrame } from '../utils/frame'
import { T } from '../utils/timing'

const CX = 1410
const CY = 540

// kartu berputar di sumbu Y: keluar ke -90°, masuk dari 90°
const flip = (frame: number, inAt: number | null, outAt: number | null) => {
  const inP = inAt === null ? 1 : tween(frame, [inAt, inAt + 14], [0, 1], easeOut)
  const outP = outAt === null ? 0 : tween(frame, [outAt, outAt + 8], [0, 1], easeIn)
  return { rot: 90 * (1 - inP) - 90 * outP, visible: inP > 0 && outP < 1 }
}

const Phrase: React.FC<{ a: string; b: string; start: number; exit: number }> = ({ a, b, start, exit }) => (
  <div style={{ position: 'absolute', left: 150, top: 540, transform: 'translateY(-50%)', width: 900 }}>
    <KineticText words={[{ text: a }]} start={start} exit={exit} size={132} align="left" color={colors.ink} />
    <KineticText words={[{ text: b, color: colors.logoBlue, weight: 700 }]} start={start + 5} exit={exit + 1} size={132} align="left" />
  </div>
)

export const ValueScene: React.FC = () => {
  const frame = useGlobalFrame()
  const { fps } = useVideoConfig()

  // --- modal PEMBAYARAN → struk (wadah yang sama berubah bentuk dan pindah) ---
  const from = { x: WIN.x + MODAL.x * UI_SCALE, y: WIN.y + MODAL.y * UI_SCALE, w: MODAL.w * UI_SCALE, h: MODAL.h * UI_SCALE }
  const to = { w: 520, h: 742 }
  const to2 = { x: CX - to.w / 2, y: CY - to.h / 2, ...to }
  const p = springAt(frame, HANDOFF, fps, SOFT)
  const rect = {
    x: from.x + (to2.x - from.x) * p,
    y: from.y + (to2.y - from.y) * p,
    w: from.w + (to2.w - from.w) * p,
    h: from.h + (to2.h - from.h) * p
  }
  const successFade = tween(frame, [HANDOFF, HANDOFF + 10], [1, 0])
  const receipt = flip(frame, null, T.word2 - 2)
  const stock = flip(frame, T.word2 + 4, T.word3 - 2)
  const dash = flip(frame, T.word3 + 4, null)

  // --- penutup: kartu dashboard terbang masuk ke dompet (callback babak hook) ---
  const w = endWallet(frame, fps)
  const fly = tween(frame, [T.endSuck, T.endGulp], [0, 1], easeInOut)
  const flyX = CX + (w.flapX - CX) * fly
  const flyY = CY + (w.flapY - CY) * fly

  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <Phrase a="Transaksi" b="cepat" start={T.word1} exit={T.word2 - 4} />
      <Phrase a="Barang" b="rapi" start={T.word2 + 2} exit={T.word3 - 4} />
      <Phrase a="Laporan" b="kebaca" start={T.word3 + 2} exit={T.endSuck - 4} />

      {receipt.visible && (
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            background: '#fff',
            borderRadius: 16 * UI_SCALE * (1 - p) + 4 * p,
            clipPath: p > 0.6 ? ZIGZAG : undefined,
            boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)',
            overflow: 'hidden',
            transform: `rotateY(${receipt.rot}deg) rotate(${2.5 * p}deg)`
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: successFade }}>
            <div style={{ transform: `scale(${UI_SCALE})`, transformOrigin: '0 0', width: MODAL.w, height: MODAL.h, position: 'relative' }}>
              <SuccessState p={1} />
            </div>
          </div>
          <ReceiptBody frame={frame} start={HANDOFF + 6} />
        </div>
      )}

      {stock.visible && (
        <div style={{ position: 'absolute', left: CX, top: CY, transform: `translate(-50%, -50%) rotateY(${stock.rot}deg) rotate(-2deg)` }}>
          <StockCard frame={frame} tick={T.word2 + 14} />
        </div>
      )}

      {dash.visible && fly < 1 && (
        <div
          style={{
            position: 'absolute',
            left: flyX,
            top: flyY,
            opacity: tween(frame, [T.endGulp - 6, T.endGulp], [1, 0]),
            transform: `translate(-50%, -50%) rotateY(${dash.rot}deg) rotate(${1.5 - 14 * fly}deg) scale(${1 - 0.94 * fly})`
          }}
        >
          <DashboardCard frame={frame} start={T.word3 + 4} />
        </div>
      )}
    </AbsoluteFill>
  )
}
