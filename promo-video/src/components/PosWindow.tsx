import { useGlobalFrame } from '../utils/frame'
import { useVideoConfig } from 'remotion'
import { CATEGORIES, CATEGORY_TINT, PAYMENT_METHODS, PRODUCTS, STORE_NAME } from '../data'
import { colors, fonts } from '../theme'
import { easeOut, keyframes, rupiah, springAt, tween, POP } from '../utils/animations'
import { T } from '../utils/timing'
import { CategoryGlyph, Cursor, IconBag, IconCart, IconCheck, IconSearch } from './Icons'

/*
 * Rakitan ulang halaman /pos (app/pages/pos/index.vue) sebagai komponen yang bisa dipakai:
 * Katalog Produk + KERANJANG + modal PEMBAYARAN. Semua state = fungsi frame global.
 */

// Ruang desain UI (px) dan skala tampil di frame 1080p
export const UW = 1240
export const UH = 660
export const UI_SCALE = 1.35
export const WIN = { x: (1920 - UW * UI_SCALE) / 2, y: (1080 - UH * UI_SCALE) / 2, w: UW * UI_SCALE, h: UH * UI_SCALE }

const LEFT_W = 860
const GRID_TOP = 186
const TILE_W = 156
const TILE_H = 206
const tilePos = (i: number) => ({ x: 16 + (i % 5) * 168, y: GRID_TOP + Math.floor(i / 5) * 218 })
const tileCenter = (i: number) => ({ x: tilePos(i).x + TILE_W / 2, y: tilePos(i).y + 96 })

const BAYAR = { x: 1054, y: 562, w: 170, h: 52 }
export const MODAL = { x: 400, y: 60, w: 440, h: 524 }
export const HANDOFF = 410
const METHOD_BTN = (i: number) => ({ x: 424 + (i % 2) * 200, y: 376 + Math.floor(i / 2) * 56, w: 192, h: 48 })
const SELESAI = { x: 568, y: 504, w: 248, h: 56 }
const center = (r: { x: number; y: number; w: number; h: number }) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

// Kursor: titik tujuan + frame tiba (klik terjadi beberapa frame sesudahnya)
const kopi = tileCenter(0)
const nasi = tileCenter(5)
const CURSOR_KEYS: Array<[number, number, number]> = [
  [232, 1160, 700],
  [254, kopi.x + 6, kopi.y + 4],
  [272, kopi.x + 6, kopi.y + 4],
  [298, nasi.x + 6, nasi.y + 4],
  [312, nasi.x + 6, nasi.y + 4],
  [336, center(BAYAR).x, center(BAYAR).y],
  [350, center(BAYAR).x, center(BAYAR).y],
  [372, center(METHOD_BTN(1)).x, center(METHOD_BTN(1)).y],
  [382, center(METHOD_BTN(1)).x, center(METHOD_BTN(1)).y],
  [390, center(SELESAI).x, center(SELESAI).y]
]

// Kamera UI: skala + titik fokus (ruang desain). Dekat sebelum klik penting, mundur ke hasil.
const CAM_KEYS: Array<[number, number, number, number]> = [
  [214, 1, 620, 330],
  [238, 1, 620, 330],
  [256, 1.9, 150, 300],
  [284, 1.9, 150, 300],
  [300, 1.9, 150, 500],
  [314, 1.9, 150, 500],
  [332, 1.65, 1050, 530],
  [346, 1.65, 1050, 530],
  [364, 1, 620, 330],
  [372, 1.45, 620, 410],
  [394, 1.45, 620, 420],
  [408, 1, 620, 330]
]

const press = (frame: number, at: number) => {
  // tombol tertekan .92 → 1
  const d = frame - at
  if (d < -2 || d > 8) return 1
  return d < 1 ? 1 - 0.04 * (d + 2) : 0.92 + 0.08 * tween(frame, [at + 1, at + 8], [0, 1], easeOut)
}

export const PosWindow: React.FC = () => {
  const frame = useGlobalFrame()
  const { fps } = useVideoConfig()

  // --- state transaksi ---
  const kopiQty = frame >= T.click2 + 1 ? 2 : frame >= T.click1 + 1 ? 1 : 0
  const nasiQty = frame >= T.click3 + 1 ? 1 : 0
  const itemCount = kopiQty + nasiQty
  const total = tween(frame, [318, 338], [0, kopiQty * 10000 + nasiQty * 35000], easeOut)
  const modalP = tween(frame, [T.modalOpen, T.modalOpen + 18], [0, 1], easeOut)
  const qrisActive = frame >= T.clickQris + 1
  const success = springAt(frame, T.success, fps, POP)

  // --- kamera UI ---
  const k = (idx: 1 | 2 | 3) => keyframes(frame, CAM_KEYS.map(c => [c[0], c[idx]] as [number, number]))
  const s = k(1)
  const tx = Math.min(0, Math.max(UW - UW * s, UW / 2 - k(2) * s))
  const ty = Math.min(0, Math.max(UH - UH * s, UH / 2 - k(3) * s))

  // --- kursor ---
  const cx = keyframes(frame, CURSOR_KEYS.map(c => [c[0], c[1]] as [number, number]))
  const cy = keyframes(frame, CURSOR_KEYS.map(c => [c[0], c[2]] as [number, number]))
  const cursorOpacity = tween(frame, [232, 240], [0, 1]) * tween(frame, [398, 406], [1, 0])
  const clickAt = [T.click1, T.click2, T.click3, T.clickBayar, T.clickQris, T.clickSelesai].find(c => frame >= c - 1 && frame <= c + 7)
  const cursorScale = clickAt === undefined ? 1 : press(frame, clickAt)

  return (
    <div style={{ width: UW, height: UH, position: 'relative', overflow: 'hidden', fontFamily: fonts.ui, color: colors.gray800, background: colors.gray50 }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        {/* ===== Katalog ===== */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: LEFT_W, height: UH }}>
          <Header frame={frame} fps={fps} />
          <SearchCard frame={frame} fps={fps} />
          {PRODUCTS.map((p, i) => (
            <ProductTile key={p.name} i={i} frame={frame} fps={fps} />
          ))}
        </div>

        {/* ===== Keranjang ===== */}
        <div style={{ position: 'absolute', left: LEFT_W, top: 0, width: UW - LEFT_W, height: UH, background: '#fff', borderLeft: `1px solid ${colors.gray200}` }}>
          <div style={{ height: 64, borderBottom: `1px solid ${colors.gray200}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
            <IconCart size={24} color={colors.primary600} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>KERANJANG</div>
              <div style={{ fontSize: 12, color: colors.gray500 }}>{itemCount} item</div>
            </div>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kopiQty > 0 && <CartRow name="Kopi Hitam" price={10000} qty={kopiQty} frame={frame} fps={fps} at={T.click1 + 1} />}
            {nasiQty > 0 && <CartRow name="Nasi Goreng" price={35000} qty={nasiQty} frame={frame} fps={fps} at={T.click3 + 1} />}
            {itemCount === 0 && (
              <div style={{ textAlign: 'center', color: colors.gray400, paddingTop: 110 }}>
                <IconCart size={56} color={colors.gray300} />
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>Keranjang Kosong</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Pilih produk untuk mulai transaksi</div>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 456, bottom: 0, background: colors.gray50, padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 20px',
                borderRadius: 16,
                border: `2px solid ${colors.primary200}`,
                background: `linear-gradient(135deg, ${colors.primary50}, ${colors.primary100})`,
                fontWeight: 900,
                boxShadow: frame > 326 && frame < 346 ? `0 0 0 ${tween(frame, [326, 346], [0, 10])}px rgba(37,99,235,${tween(frame, [326, 346], [0.35, 0])})` : undefined
              }}
            >
              <span style={{ fontSize: 20, color: colors.gray700 }}>TOTAL</span>
              <span style={{ fontSize: 26, color: colors.primary700, fontVariantNumeric: 'tabular-nums' }}>{rupiah(total)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              <Btn label="TUNAI PAS" bg={colors.emerald500} />
              <Btn label="BAYAR" bg={colors.primary600} scale={press(frame, T.clickBayar)} />
            </div>
          </div>
        </div>

        {/* ===== Modal PEMBAYARAN (mekar dari tombol BAYAR) ===== */}
        {modalP > 0 && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.55 * modalP})` }} />
            {/* dari HANDOFF, modal diambil alih kartu struk di ValueScene */}
            {frame < HANDOFF && <PaymentModal p={modalP} frame={frame} qrisActive={qrisActive} success={success} />}
          </>
        )}

        {/* ===== Kursor (di dalam rig supaya ikut membesar bersama tombol) ===== */}
        <div style={{ position: 'absolute', left: cx - 4, top: cy - 2, opacity: cursorOpacity, transform: `scale(${cursorScale / s * 1.25})`, transformOrigin: '4px 2px' }}>
          <Cursor size={30} />
        </div>
      </div>
    </div>
  )
}

const Header: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const p = springAt(frame, T.tilesIn - 8, fps)
  return (
    <div style={{ position: 'absolute', left: 16, top: 12, display: 'flex', alignItems: 'center', gap: 12, opacity: p, transform: `translateY(${(1 - p) * -20}px)` }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: colors.primary600, display: 'grid', placeItems: 'center', boxShadow: '0 8px 16px rgba(37,99,235,0.3)' }}>
        <IconBag size={24} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Katalog Produk</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{STORE_NAME}</div>
      </div>
    </div>
  )
}

const SearchCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const p = springAt(frame, T.tilesIn - 5, fps)
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: 66,
        width: LEFT_W - 32,
        height: 106,
        background: '#fff',
        borderRadius: 16,
        border: `1px solid ${colors.gray100}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        padding: 14,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`
      }}
    >
      <div style={{ height: 40, borderRadius: 12, background: colors.gray50, border: `2px solid ${colors.gray50}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: colors.gray400, fontSize: 14 }}>
        <IconSearch size={20} color={colors.gray400} />
        Cari produk...
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {CATEGORIES.map((c, i) => (
          <div
            key={c}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 8,
              background: i === 0 ? colors.primary600 : '#fff',
              color: i === 0 ? '#fff' : colors.gray700,
              border: `1px solid ${i === 0 ? colors.primary600 : colors.gray200}`
            }}
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  )
}

const ProductTile: React.FC<{ i: number; frame: number; fps: number }> = ({ i, frame, fps }) => {
  const prod = PRODUCTS[i]
  const { x, y } = tilePos(i)
  // tanda tangan gerak "dirapikan": miring & tergeser → lurus ke grid
  const p = springAt(frame, T.tilesIn + i * 2, fps)
  const rot = (i % 2 ? 7 : -6) * (1 - p)
  const clicks = i === 0 ? [T.click1, T.click2] : i === 5 ? [T.click3] : []
  const sc = clicks.reduce((acc, c) => acc * press(frame, c), 1)
  const tint = CATEGORY_TINT[prod.category]
  const selected = (i === 0 && frame > T.click1) || (i === 5 && frame > T.click3)
  const stock = prod.stock - (i === 0 ? (frame > T.click2 ? 2 : frame > T.click1 ? 1 : 0) : i === 5 && frame > T.click3 ? 1 : 0)
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: TILE_W,
        height: TILE_H,
        background: '#fff',
        borderRadius: 12,
        border: `${selected ? 2 : 1}px solid ${selected ? colors.primary600 : colors.gray200}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        opacity: Math.min(1, p * 1.5),
        transform: `translate(${(1 - p) * (i % 3 - 1) * 30}px, ${(1 - p) * 60}px) rotate(${rot}deg) scale(${sc})`
      }}
    >
      <div style={{ height: 120, background: tint.bg, display: 'grid', placeItems: 'center' }}>
        <CategoryGlyph kind={prod.category} size={58} color={tint.fg} />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: colors.primary600, marginTop: 4 }}>{rupiah(prod.price)}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>Stok: {stock}</div>
      </div>
      {clicks.map(c => {
        const q = tween(frame, [c, c + 14], [0, 1], easeOut)
        if (q <= 0 || q >= 1) return null
        return (
          <div key={c} style={{ position: 'absolute', right: 10, top: 64 - q * 50, opacity: 1 - q, background: colors.primary600, color: '#fff', fontWeight: 900, fontSize: 14, borderRadius: 999, padding: '2px 10px' }}>
            +1
          </div>
        )
      })}
    </div>
  )
}

const CartRow: React.FC<{ name: string; price: number; qty: number; frame: number; fps: number; at: number }> = ({ name, price, qty, frame, fps, at }) => {
  const p = springAt(frame, at, fps)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: colors.gray50, borderRadius: 12, padding: 10, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 12, color: colors.gray500 }}>{rupiah(price)}</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: colors.primary700, marginTop: 2 }}>{rupiah(price * qty)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, border: `2px solid ${colors.gray200}` }}>
        <span style={{ width: 30, textAlign: 'center', color: colors.red600, fontWeight: 700, fontSize: 18 }}>−</span>
        <span style={{ width: 34, textAlign: 'center', fontWeight: 900, fontSize: 14 }}>{qty}</span>
        <span style={{ width: 30, textAlign: 'center', color: colors.primary600, fontWeight: 700, fontSize: 18 }}>+</span>
      </div>
    </div>
  )
}

const Btn: React.FC<{ label: string; bg: string; scale?: number }> = ({ label, bg, scale = 1 }) => (
  <div style={{ height: 52, borderRadius: 10, background: bg, color: '#fff', fontWeight: 900, fontSize: 16, display: 'grid', placeItems: 'center', transform: `scale(${scale})` }}>{label}</div>
)

const PaymentModal: React.FC<{ p: number; frame: number; qrisActive: boolean; success: number }> = ({ p, frame, qrisActive, success }) => {
  // wadah mekar: rect tombol BAYAR → rect modal
  const lerp = (a: number, b: number) => a + (b - a) * p
  const content = tween(frame, [T.modalOpen + 8, T.modalOpen + 20], [0, 1])
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(BAYAR.x, MODAL.x),
        top: lerp(BAYAR.y, MODAL.y),
        width: lerp(BAYAR.w, MODAL.w),
        height: lerp(BAYAR.h, MODAL.h),
        borderRadius: lerp(10, 16),
        background: p < 0.4 ? colors.primary600 : '#fff',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        overflow: 'hidden'
      }}
    >
      <div style={{ width: MODAL.w, opacity: content * (1 - success) }}>
        <div style={{ height: 70, borderBottom: `1px solid ${colors.gray200}`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 24, color: colors.gray800 }}>PEMBAYARAN</div>
        <div style={{ padding: 24 }}>
          <div style={{ background: colors.gray50, border: `1px solid ${colors.gray200}`, borderRadius: 16, padding: 16, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: colors.gray500 }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>{rupiah(55000)}</span>
            </div>
            <div style={{ height: 1, background: colors.gray200, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 18 }}>{rupiah(55000)}</span>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray700, marginTop: 16 }}>Nama Pelanggan (Opsional)</div>
          <div style={{ height: 44, borderRadius: 12, border: `2px solid ${colors.gray300}`, marginTop: 8, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: colors.gray400 }}>Masukkan nama pelanggan...</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray700, marginTop: 18 }}>Metode Pembayaran</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {PAYMENT_METHODS.map((m, i) => {
              const active = i === 1 ? qrisActive : i === 0 && !qrisActive
              return (
                <div
                  key={m}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: `2px solid ${active ? colors.primary600 : colors.gray200}`,
                    background: active ? colors.primary600 : colors.gray50,
                    color: active ? '#fff' : colors.gray700,
                    fontWeight: 700,
                    fontSize: 16,
                    display: 'grid',
                    placeItems: 'center',
                    transform: `scale(${i === 1 ? press(frame, T.clickQris) : 1})`
                  }}
                >
                  {m}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ width: 136, height: 56, borderRadius: 12, background: colors.gray200, color: colors.gray700, fontWeight: 900, fontSize: 16, display: 'grid', placeItems: 'center' }}>BATAL</div>
            <div style={{ flex: 1, height: 56, borderRadius: 12, background: colors.green600, color: '#fff', fontWeight: 900, fontSize: 18, display: 'grid', placeItems: 'center', transform: `scale(${press(frame, T.clickSelesai)})` }}>✓ SELESAI</div>
          </div>
        </div>
      </div>
      {success > 0 && <SuccessState p={success} />}
    </div>
  )
}

export const SuccessState: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, opacity: Math.min(1, p * 2), fontFamily: fonts.ui }}>
    <div style={{ width: 120, height: 120, borderRadius: '50%', background: colors.emerald50, display: 'grid', placeItems: 'center', transform: `scale(${0.4 + 0.6 * p})` }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', background: colors.emerald500, display: 'grid', placeItems: 'center' }}>
        <IconCheck size={52} color="#fff" stroke={3} />
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: colors.gray800, textAlign: 'center', lineHeight: 1.25 }}>
      Transaksi Berhasil
      <br />
      Disimpan
    </div>
  </div>
)
