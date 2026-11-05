import { AbsoluteFill, spring } from 'remotion'
import { colors, fonts } from '../theme'
import { easeIn, easeInOut, easeOut, keyframes, rupiah, tween } from '../utils/animations'
import { useGlobalFrame } from '../utils/frame'
import { Burst, Glitch, LightSweep, shakeAt } from './fx'
import { ACT, at, FPS, L } from './timeline'

// Phone sits under the caption band, inside the story safe area
export const PHONE = { x: 230, y: 470, w: 620, h: 1150, r: 64 }
const SCREEN_W = PHONE.w - 28

// ---- moments (frame numbers) -------------------------------------------------
const M = {
  debtListIn: at(L.debt, 0.3),
  debtTap: at(L.debt, 0.52),
  debtSheet: at(L.debt, 0.55),
  debtType: at(L.debt, 0.6),
  debtSave: at(L.debt, 0.86),
  debtDone: at(L.debt, 0.9),
  stockCard: at(L.stock, 0.2),
  stockBadge: at(L.stock, 0.62),
  stockToast: at(L.stock, 0.66),
  wifiBreak: at(L.offline, 0.08),
  offlineTap: at(L.offline, 0.5),
  offlinePay: at(L.offline, 0.66),
  offlineSaved: at(L.offline, 0.72),
  wifiBack: at(L.offline, 0.95),
  synced: at(L.offline, 1.0) + 2,
  reportCount: at(L.report, 0.05),
  reportUp: at(L.report, 0.55)
}
export const PHONE_HITS = [M.debtTap, M.debtSave, M.stockBadge, M.wifiBreak, M.offlinePay, M.reportUp]

// ---- small UI atoms ----------------------------------------------------------
const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: '#fff', borderRadius: 22, border: `2px solid ${colors.gray200}`, boxShadow: '0 4px 14px rgba(15,23,42,0.05)', ...style }}>{children}</div>
)

const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at: t0, x, y }) => {
  const frame = useGlobalFrame()
  const t = frame - t0
  if (t < -8 || t > 16) return null
  const press = t < 0 ? tween(frame, [t0 - 8, t0], [0, 1], easeOut) : 1 - tween(frame, [t0 + 4, t0 + 14], [0, 1])
  const ring = t >= 0 ? tween(frame, [t0, t0 + 14], [0, 1], easeOut) : 0
  return (
    <>
      <div style={{ position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: '50%', background: 'rgba(15,23,42,0.22)', border: '3px solid rgba(255,255,255,0.9)', opacity: press, transform: `scale(${0.8 + press * 0.2})` }} />
      {ring > 0 && <div style={{ position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: '50%', border: `4px solid ${colors.primary600}`, opacity: 1 - ring, transform: `scale(${0.4 + ring})` }} />}
    </>
  )
}

const Toast: React.FC<{ at: number; until: number; tone: 'success' | 'warning' | 'info'; title: string; desc?: string }> = ({ at: t0, until, tone, title, desc }) => {
  const frame = useGlobalFrame()
  if (frame < t0 - 1 || frame > until + 10) return null
  const inP = spring({ frame: frame - t0, fps: FPS, config: { damping: 13, stiffness: 190 } })
  const out = tween(frame, [until, until + 9], [0, 1], easeIn)
  const bg = tone === 'success' ? colors.emerald50 : tone === 'warning' ? '#FFFBEB' : colors.primary50
  const fg = tone === 'success' ? colors.emerald700 : tone === 'warning' ? '#92400E' : colors.primary700
  const dot = tone === 'success' ? colors.emerald500 : tone === 'warning' ? '#F59E0B' : colors.primary600
  return (
    <div style={{ position: 'absolute', left: 20, right: 20, top: 70, transform: `translateY(${(1 - inP) * -140 - out * 140}px)`, opacity: 1 - out, background: bg, border: `2px solid ${dot}`, borderRadius: 20, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 16px 30px rgba(15,23,42,0.18)', zIndex: 20 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 800, fontSize: 26, color: fg }}>{title}</div>
        {desc && <div style={{ fontSize: 22, color: fg, opacity: 0.85, marginTop: 2 }}>{desc}</div>}
      </div>
    </div>
  )
}

const countTo = (frame: number, t0: number, t1: number, a: number, b: number) => Math.round(tween(frame, [t0, t1], [a, b], easeOut) / 500) * 500

// ---- icons -------------------------------------------------------------------
const Ico: React.FC<{ d: string; size?: number; color?: string; sw?: number }> = ({ d, size = 30, color = 'currentColor', sw = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const ICON = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  cart: 'M3 4h2l2.4 11h11l2-8H6.2M9 20a1 1 0 1 0 0-.01M18 20a1 1 0 1 0 0-.01',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2 3.4-.2-.1a1.6 1.6 0 0 0-1.9.2l-.4.3-1 .6-.3 2H10l-.3-2-1-.6-.4-.3a1.6 1.6 0 0 0-1.9-.2l-.2.1-2-3.4.1-.1a1.6 1.6 0 0 0 .3-1.8L4 13.8V10.2l.6-1.2a1.6 1.6 0 0 0-.3-1.8l-.1-.1 2-3.4.2.1a1.6 1.6 0 0 0 1.9-.2l.4-.3 1-.6.3-2h4l.3 2 1 .6.4.3a1.6 1.6 0 0 0 1.9.2l.2-.1 2 3.4-.1.1a1.6 1.6 0 0 0-.3 1.8l.6 1.2v3.6z',
  wifi: 'M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01',
  check: 'M5 12l5 5L20 7',
  cloud: 'M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 9.5a4.5 4.5 0 0 1-.5 8.5H7zM12 12v6M9.5 14.5L12 12l2.5 2.5'
}

// ---- phone chrome ------------------------------------------------------------
const StatusBar: React.FC = () => {
  const frame = useGlobalFrame()
  const offline = frame >= M.wifiBreak && frame < M.wifiBack
  return (
    <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', fontFamily: fonts.ui, fontWeight: 700, fontSize: 24, color: colors.ink }}>
      <span>09.41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <Glitch at={M.wifiBreak}>
          <div style={{ position: 'relative', width: 30, height: 30 }}>
            <Ico d={ICON.wifi} size={30} color={offline ? colors.red600 : colors.ink} />
            {offline && <div style={{ position: 'absolute', left: -2, top: 13, width: 34, height: 4, background: colors.red600, transform: 'rotate(-40deg)', borderRadius: 2 }} />}
          </div>
        </Glitch>
        <div style={{ width: 40, height: 20, border: `3px solid ${colors.ink}`, borderRadius: 6, padding: 2 }}><div style={{ width: '70%', height: '100%', background: colors.ink, borderRadius: 2 }} /></div>
      </div>
    </div>
  )
}

const BottomNav: React.FC<{ active: number; badgeAt?: number }> = ({ active, badgeAt }) => {
  const frame = useGlobalFrame()
  const items = [['Beranda', ICON.home], ['Kasir', ICON.cart], ['Laporan', ICON.chart], ['Barang', ICON.box], ['Atur', ICON.gear]] as const
  const badge = badgeAt === undefined ? 0 : spring({ frame: frame - badgeAt, fps: FPS, config: { damping: 9, stiffness: 240, mass: 0.6 } })
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 108, background: '#fff', borderTop: `2px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontFamily: fonts.ui }}>
      {items.map(([label, d], i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 18, background: i === active ? colors.primary50 : 'transparent', color: i === active ? colors.primary600 : colors.gray400, position: 'relative' }}>
          <Ico d={d} size={30} />
          <span style={{ fontSize: 17, fontWeight: 700 }}>{label}</span>
          {i === 3 && badge > 0.01 && (
            <div style={{ position: 'absolute', top: -2, right: 2, minWidth: 30, height: 30, borderRadius: 15, background: colors.red600, color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${badge})`, boxShadow: '0 0 0 4px #fff' }}>2</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---- screens -----------------------------------------------------------------
const Header: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div style={{ padding: '6px 30px 18px' }}>
    <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 42, color: colors.ink, letterSpacing: '-0.02em' }}>{title}</div>
    {sub && <div style={{ fontSize: 22, color: colors.gray500, marginTop: 2 }}>{sub}</div>}
  </div>
)

const DebtScreen: React.FC = () => {
  const frame = useGlobalFrame()
  const sisaAni = frame < M.debtDone ? 45000 : countTo(frame, M.debtDone, M.debtDone + 16, 45000, 25000)
  const total = frame < M.debtDone ? 145000 : countTo(frame, M.debtDone, M.debtDone + 16, 145000, 125000)
  const rows = [
    { name: 'Bu Ani', info: '3 nota · sejak 2 Okt', amount: sisaAni },
    { name: 'Pak Udin', info: '2 nota · sejak 9 Okt', amount: 60000 },
    { name: 'Mbak Rina', info: '1 nota · sejak 21 Okt', amount: 40000 }
  ]
  const sheet = keyframes(frame, [[M.debtSheet, 0], [M.debtSheet + 8, 1], [M.debtSave + 2, 1], [M.debtSave + 10, 0]], easeOut)
  const typed = '20.000'.slice(0, Math.max(0, Math.floor(tween(frame, [M.debtType, M.debtType + 14], [0, 6]))))
  return (
    <>
      <Header title="Hutang Pelanggan" sub="Catat cicilan, tanpa buku" />
      <div style={{ margin: '0 24px', borderRadius: 24, padding: '22px 26px', background: 'linear-gradient(135deg,#FEF2F2,#FFF7ED)', border: '2px solid #FECACA' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#B91C1C', letterSpacing: '0.04em' }}>TOTAL BELUM DIBAYAR</div>
        <div style={{ fontFamily: fonts.display, fontSize: 56, fontWeight: 800, color: '#B91C1C', marginTop: 4 }}>{rupiah(total)}</div>
        <div style={{ fontSize: 21, color: colors.gray500 }}>3 pelanggan · 6 nota</div>
      </div>
      <div style={{ margin: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((r, i) => {
          const p = tween(frame, [M.debtListIn + i * 4, M.debtListIn + i * 4 + 12], [0, 1], easeOut)
          const pulse = i === 0 && frame >= M.debtDone ? 1 - tween(frame, [M.debtDone, M.debtDone + 20], [0, 1]) : 0
          return (
            <Card key={r.name} style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translateX(${(1 - p) * 80}px)`, borderColor: pulse > 0 ? colors.emerald500 : colors.gray200, boxShadow: pulse > 0 ? `0 0 0 ${6 * pulse}px rgba(16,185,129,0.25)` : undefined }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', color: '#B91C1C', fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.name.split(' ').pop()![0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 27, color: colors.ink }}>{r.name}</div>
                <div style={{ fontSize: 20, color: colors.gray500 }}>{r.info}</div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 28, color: colors.red600 }}>{rupiah(r.amount)}</div>
            </Card>
          )
        })}
        <div style={{ marginTop: 6, padding: '20px 0', borderRadius: 20, background: colors.primary600, color: '#fff', textAlign: 'center', fontWeight: 900, fontSize: 28, opacity: tween(frame, [M.debtListIn + 14, M.debtListIn + 24], [0, 1]) }}>Bayar Cicilan · Bu Ani</div>
      </div>
      <Tap at={M.debtTap} x={SCREEN_W / 2} y={785} />

      {/* bottom sheet */}
      {sheet > 0.01 && (
        <>
          <AbsoluteFill style={{ background: `rgba(15,23,42,${0.45 * sheet})` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 560, background: '#fff', borderRadius: '34px 34px 0 0', padding: '30px 30px', transform: `translateY(${(1 - sheet) * 560}px)` }}>
            <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 36, color: colors.ink }}>Bayar Cicilan</div>
            <div style={{ fontSize: 22, color: colors.gray500 }}>Bu Ani · sisa Rp 45.000</div>
            <div style={{ marginTop: 22, fontSize: 22, fontWeight: 800, color: colors.gray700 }}>Jumlah bayar</div>
            <div style={{ marginTop: 10, border: `3px solid ${colors.primary600}`, borderRadius: 18, padding: '16px 22px', fontSize: 48, fontWeight: 900, color: colors.ink, display: 'flex', gap: 14 }}>
              <span style={{ color: colors.gray400 }}>Rp</span>{typed}<span style={{ width: 3, background: colors.primary600, opacity: frame % 20 < 10 ? 1 : 0 }} />
            </div>
            <div style={{ marginTop: 14, fontSize: 21, color: colors.gray500 }}>Sisa setelah ini: <b style={{ color: colors.ink }}>Rp 25.000</b></div>
            <div style={{ marginTop: 26, padding: '22px 0', borderRadius: 20, background: colors.primary600, color: '#fff', textAlign: 'center', fontWeight: 900, fontSize: 30 }}>Simpan Pembayaran</div>
            <Tap at={M.debtSave} x={SCREEN_W / 2} y={440} />
          </div>
        </>
      )}
      <Toast at={M.debtDone} until={ACT.debt.to - 6} tone="success" title="Cicilan tersimpan" desc="Bu Ani bayar Rp 20.000" />
      <Burst at={M.debtDone} x={SCREEN_W - 120} y={470} colors={[colors.emerald500, colors.logoYellow, colors.primary600]} count={14} spread={160} />
    </>
  )
}

const StockScreen: React.FC = () => {
  const frame = useGlobalFrame()
  const card = tween(frame, [M.stockCard, M.stockCard + 12], [0, 1], easeOut)
  return (
    <>
      <Header title="Selamat Pagi!" sub="Warung Bu Siti" />
      <div style={{ margin: '0 24px', borderRadius: 28, padding: '26px 28px', background: 'linear-gradient(90deg,#2563EB,#1D4ED8)', color: '#fff' }}>
        <div style={{ fontSize: 22, opacity: 0.85 }}>Uang Masuk Hari Ini</div>
        <div style={{ fontFamily: fonts.display, fontSize: 60, fontWeight: 800 }}>Rp 1.250.000</div>
        <div style={{ fontSize: 20, opacity: 0.85 }}>Dari 46 kali jualan</div>
      </div>
      <Card style={{ margin: '22px 24px 0', overflow: 'hidden', borderColor: '#FED7AA', opacity: card, transform: `translateY(${(1 - card) * 60}px) scale(${0.96 + card * 0.04})` }}>
        <div style={{ padding: '18px 24px', background: '#FFF7ED', fontWeight: 900, fontSize: 22, color: '#9A3412', letterSpacing: '0.03em' }}>⚠ BARANG MAU HABIS <span style={{ fontWeight: 700, color: '#C2410C' }}>(2 barang)</span></div>
        {[['Teh es', 'Sisa 4 pcs', '#FFEDD5', '#C2410C'], ['Gula pasir', 'Habis', '#FEE2E2', '#B91C1C']].map(([name, left, bg, fg], i) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderTop: i ? `2px solid ${colors.gray100}` : undefined }}>
            <span style={{ fontSize: 27, fontWeight: 700, color: colors.gray700 }}>{name}</span>
            <span style={{ fontSize: 22, fontWeight: 800, padding: '6px 16px', borderRadius: 999, background: bg, color: fg }}>{left}</span>
          </div>
        ))}
      </Card>
      <BottomNav active={0} badgeAt={M.stockBadge} />
      <Burst at={M.stockBadge} x={SCREEN_W * 0.7 + 34} y={1010} colors={[colors.red600, '#F59E0B', '#fff']} count={12} spread={120} size={10} />
      <Toast at={M.stockToast} until={ACT.stock.to - 4} tone="warning" title="Stok mau habis" desc="Teh es sisa 4 pcs" />
    </>
  )
}

const OfflineScreen: React.FC = () => {
  const frame = useGlobalFrame()
  const offline = frame >= M.wifiBreak && frame < M.wifiBack
  const banner = tween(frame, [M.wifiBreak + 2, M.wifiBreak + 10], [0, 1], easeOut) * (1 - tween(frame, [M.wifiBack, M.wifiBack + 8], [0, 1]))
  const items = [['Teh es', 'Rp 3.000'], ['Nasi goreng', 'Rp 15.000'], ['Kopi susu', 'Rp 5.000'], ['Gorengan', 'Rp 2.000']]
  const inCart = frame >= M.offlineTap ? 1 : 0
  return (
    <>
      {banner > 0.01 && (
        <div style={{ margin: '0 0 10px', height: 64 * banner, overflow: 'hidden', background: '#FEF3C7', borderBottom: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#78350F' }}>
          Sedang offline · kasir tetap bisa jualan
        </div>
      )}
      <Header title="Kasir" sub={offline ? 'Transaksi disimpan di HP' : 'Katalog produk'} />
      <div style={{ margin: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {items.map(([name, price], i) => (
          <Card key={name} style={{ padding: '0 0 16px', overflow: 'hidden', textAlign: 'center', borderColor: i === 0 && inCart ? colors.primary600 : colors.gray200 }}>
            <div style={{ height: 150, background: [`#DBEAFE`, '#FEF3C7', '#EDE9FE', '#FFE4E6'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>{['🧋', '🍛', '☕', '🍤'][i]}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.gray800, marginTop: 12 }}>{name}</div>
            <div style={{ fontSize: 23, fontWeight: 900, color: colors.primary600 }}>{price}</div>
          </Card>
        ))}
      </div>
      <Tap at={M.offlineTap} x={150} y={offline ? 400 : 340} />
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 30, borderRadius: 24, background: inCart ? colors.primary600 : colors.gray400, color: '#fff', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 28 }}>
        <span>{inCart ? '1 item' : 'Keranjang kosong'}</span><span>{inCart ? 'TUNAI PAS · Rp 3.000' : 'Rp 0'}</span>
      </div>
      <Tap at={M.offlinePay} x={SCREEN_W / 2} y={1080} />
      <Toast at={M.offlineSaved} until={M.wifiBack - 2} tone="warning" title="Tersimpan di HP (offline)" desc="Dikirim otomatis saat online" />
      <Toast at={M.synced} until={ACT.offline.to - 2} tone="success" title="1 transaksi offline terkirim" />
    </>
  )
}

const ReportScreen: React.FC = () => {
  const frame = useGlobalFrame()
  const sales = countTo(frame, M.reportCount, M.reportCount + 40, 0, 2450000)
  const up = spring({ frame: frame - M.reportUp, fps: FPS, config: { damping: 10, stiffness: 200, mass: 0.7 } })
  const bars = [38, 52, 44, 61, 58, 72, 86]
  return (
    <>
      <Header title="Laporan" sub="7 hari terakhir" />
      <Card style={{ margin: '0 24px', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: colors.gray500, letterSpacing: '0.05em' }}>PENJUALAN</div>
        <div style={{ fontFamily: fonts.display, fontSize: 64, fontWeight: 800, color: colors.ink }}>{rupiah(sales)}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6, padding: '8px 16px', borderRadius: 999, background: colors.emerald50, color: colors.emerald700, fontWeight: 900, fontSize: 26, transform: `scale(${up})`, transformOrigin: 'left center' }}>
          ▲ 12% <span style={{ fontWeight: 700, fontSize: 21 }}>dibanding minggu lalu</span>
        </div>
        <LightSweep at={M.reportUp + 2} duration={16} />
      </Card>
      <Card style={{ margin: '20px 24px 0', padding: '26px 24px 18px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: colors.gray700, marginBottom: 14 }}>Omset per Hari</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 300 }}>
          {bars.map((h, i) => {
            const g = tween(frame, [M.reportCount + i * 3, M.reportCount + i * 3 + 18], [0, 1], easeOut)
            return <div key={i} style={{ flex: 1, height: `${h * g}%`, borderRadius: '12px 12px 0 0', background: i === bars.length - 1 ? colors.logoYellow : '#FCD34D' }} />
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {['30/10', '31/10', '1/11', '2/11', '3/11', '4/11', '5/11'].map(d => <span key={d} style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: colors.gray500 }}>{d}</span>)}
        </div>
      </Card>
      <BottomNav active={2} />
      <Burst at={M.reportUp} x={150} y={330} colors={[colors.emerald500, colors.logoYellow, colors.primary600]} count={16} spread={180} />
    </>
  )
}

// ---- assembly ----------------------------------------------------------------
type Win = { from: number; to: number }
/** Whip pan between screens: slide + horizontal motion blur. */
const ScreenSlot: React.FC<{ win: Win; first?: boolean; last?: boolean; children: React.ReactNode }> = ({ win, first, last, children }) => {
  const frame = useGlobalFrame()
  if (frame < win.from || frame > win.to) return null
  const inP = first ? 1 : tween(frame, [win.from, win.from + 9], [0, 1], easeOut)
  const outP = last ? 0 : tween(frame, [win.to - 8, win.to], [0, 1], easeIn)
  const x = (1 - inP) * SCREEN_W - outP * SCREEN_W
  const blur = (1 - inP) * 18 + outP * 18
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateX(${x}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, fontFamily: fonts.ui }}>
      {children}
    </div>
  )
}

export const StoryPhone: React.FC = () => {
  const frame = useGlobalFrame()
  if (frame < ACT.phone.from || frame > ACT.phone.to) return null

  // Enter: rises from the paper scraps with a spring; exit: shrinks into the logo
  const rise = spring({ frame: frame - ACT.phone.from, fps: FPS, config: { damping: 15, stiffness: 120, mass: 1 } })
  const exitP = tween(frame, [L.cta.from - 2, ACT.phone.to], [0, 1], easeInOut)
  const shake = shakeAt(frame, PHONE_HITS, 8)
  const y = (1 - rise) * 1400 - exitP * 120
  const scale = (0.86 + rise * 0.14) * (1 - exitP * 0.88)
  const rot = (1 - rise) * 14 + exitP * -8

  return (
    <div style={{ position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, transform: `translate(${shake.x}px, ${y + shake.y}px) rotate(${rot}deg) scale(${scale})`, transformOrigin: '50% 40%', opacity: 1 - tween(frame, [ACT.phone.to - 6, ACT.phone.to], [0, 1]) }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: PHONE.r, background: '#0B1220', boxShadow: '0 60px 120px rgba(15,23,42,0.45), inset 0 0 0 3px #2A3446' }} />
      <div style={{ position: 'absolute', inset: 14, borderRadius: PHONE.r - 14, overflow: 'hidden', background: colors.slate50 }}>
        <StatusBar />
        <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 }}>
          <ScreenSlot win={ACT.debt} first><DebtScreen /></ScreenSlot>
          <ScreenSlot win={ACT.stock}><StockScreen /></ScreenSlot>
          <ScreenSlot win={ACT.offline}><OfflineScreen /></ScreenSlot>
          <ScreenSlot win={ACT.report} last><ReportScreen /></ScreenSlot>
        </div>
        <div style={{ position: 'absolute', top: 12, left: '50%', width: 150, height: 34, marginLeft: -75, borderRadius: 20, background: '#0B1220' }} />
      </div>
    </div>
  )
}
