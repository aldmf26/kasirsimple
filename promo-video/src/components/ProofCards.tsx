import { CATEGORY_TINT, STORE_NAME } from '../data'
import { colors, fonts } from '../theme'
import { easeOut, rupiah, tween } from '../utils/animations'
import { CategoryGlyph, IconBanknotes, IconCheck } from './Icons'

/* Kartu bukti untuk babak value — tiap kartu = komponen asli app yang diperbesar. */

// Struk 58mm: 32 kolom, format sama dengan app/utils/receipt-generator.ts
const COLS = 32
const center = (s: string) => ' '.repeat(Math.max(0, Math.floor((COLS - s.length) / 2))) + s
const justify = (l: string, r: string) => l + ' '.repeat(Math.max(1, COLS - l.length - r.length)) + r
const line = '-'.repeat(COLS)
export const RECEIPT_LINES = [
  center(STORE_NAME),
  center('Jl. Demo No. 123'),
  center('081234567890'),
  '',
  'No: TRX-20261103-038',
  '03/11/2026 14:32',
  line,
  '2x Kopi Hitam',
  justify('   2 pcs × Rp 10.000', 'Rp 20.000'),
  '1x Nasi Goreng',
  justify('   1 pcs × Rp 35.000', 'Rp 35.000'),
  line,
  justify('SUBTOTAL', 'Rp 55.000'),
  line,
  justify('TOTAL', 'Rp 55.000'),
  justify('BAYAR (QRIS)', 'Rp 55.000'),
  justify('KEMBALI', 'Rp 0'),
  '',
  center('Terima Kasih'),
  center('Silahkan Datang Kembali')
]

export const ReceiptBody: React.FC<{ frame: number; start: number }> = ({ frame, start }) => (
  <div style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: 25, lineHeight: 1.32, color: '#1F2328', whiteSpace: 'pre', padding: '34px 22px' }}>
    {RECEIPT_LINES.map((l, i) => {
      // tercetak baris demi baris dari atas
      const p = tween(frame, [start + i * 1.2, start + i * 1.2 + 4], [0, 1])
      const bold = l.startsWith('TOTAL')
      return (
        <div key={i} style={{ opacity: p, fontSize: bold ? 28 : 25, height: 33 }}>
          {l || ' '}
        </div>
      )
    })}
  </div>
)

// tepi bawah bergerigi seperti kertas thermal yang disobek
export const ZIGZAG = (() => {
  const pts = ['0 0', '100% 0']
  for (let i = 24; i >= 0; i--) pts.push(`${(i / 24) * 100}% ${i % 2 ? 'calc(100% - 14px)' : '100%'}`)
  return `polygon(${pts.join(',')})`
})()

export const StockCard: React.FC<{ frame: number; tick: number }> = ({ frame, tick }) => {
  const stock = frame >= tick + 8 ? 48 : frame >= tick ? 49 : 50
  const bump = 1 + 0.12 * Math.sin(Math.PI * tween(frame, [tick, tick + 6], [0, 1])) + 0.12 * Math.sin(Math.PI * tween(frame, [tick + 8, tick + 14], [0, 1]))
  const tint = CATEGORY_TINT.Minuman
  return (
    <div style={{ width: 460, background: '#fff', borderRadius: 28, overflow: 'hidden', fontFamily: fonts.ui, boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)', border: `3px solid ${colors.primary600}` }}>
      <div style={{ height: 300, background: tint.bg, display: 'grid', placeItems: 'center' }}>
        <CategoryGlyph kind="Minuman" size={150} color={tint.fg} />
      </div>
      <div style={{ padding: '26px 32px 32px' }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: colors.gray800 }}>Kopi Hitam</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: colors.primary600, marginTop: 6 }}>{rupiah(10000)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: colors.gray500 }}>Stok</span>
          <span style={{ fontSize: 44, fontWeight: 900, color: colors.gray800, fontVariantNumeric: 'tabular-nums', display: 'inline-block', minWidth: 70, textAlign: 'right', transform: `scale(${bump})` }}>{stock}</span>
        </div>
        <div style={{ height: 12, borderRadius: 99, background: colors.gray100, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: `${stock}%`, height: '100%', background: colors.emerald500, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  )
}

export const DashboardCard: React.FC<{ frame: number; start: number }> = ({ frame, start }) => {
  // angka demo: total hari ini sebelum + sesudah transaksi Rp 55.000
  const money = tween(frame, [start + 4, start + 24], [1245000, 1300000], easeOut)
  const count = frame >= start + 14 ? 38 : 37
  const row = tween(frame, [start + 10, start + 22], [0, 1], easeOut)
  return (
    <div style={{ width: 680, fontFamily: fonts.ui }}>
      <div style={{ borderRadius: 40, padding: 44, color: '#fff', background: `linear-gradient(90deg, ${colors.primary600}, ${colors.primary700})`, boxShadow: '0 40px 80px -30px rgba(29,78,216,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 500, color: colors.primary100 }}>Uang Masuk Hari Ini:</div>
          <div style={{ fontSize: 72, fontWeight: 900, marginTop: 6, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{rupiah(money)}</div>
          <div style={{ fontSize: 30, color: colors.primary100, marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconCheck size={30} color={colors.primary100} stroke={2.6} /> Dari {count} kali jualan
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 24, padding: 16 }}>
          <IconBanknotes size={56} color="#fff" />
        </div>
      </div>
      <div
        style={{
          marginTop: 20,
          background: '#fff',
          borderRadius: 28,
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 30px 60px -30px rgba(15,23,42,0.3)',
          opacity: row,
          transform: `translateY(${(1 - row) * 40}px)`
        }}
      >
        <div>
          <div style={{ fontSize: 38, fontWeight: 700, color: colors.gray800 }}>{rupiah(55000)}</div>
          <div style={{ fontSize: 30, color: colors.gray400, textTransform: 'uppercase', marginTop: 2 }}>qris • 14:32</div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: colors.emerald500, display: 'grid', placeItems: 'center' }}>
          <IconCheck size={34} color="#fff" stroke={3} />
        </div>
      </div>
    </div>
  )
}
