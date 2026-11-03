// Ikon garis gaya heroicons (dipakai app lewat i-heroicons-*), digambar inline supaya render offline.
type P = { size?: number; color?: string; stroke?: number; style?: React.CSSProperties }

const Outline: React.FC<P & { d: string }> = ({ d, size = 24, color = 'currentColor', stroke = 1.8, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
)

export const IconSearch: React.FC<P> = p => <Outline {...p} d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
export const IconBag: React.FC<P> = p => (
  <Outline {...p} d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.36-2 1.26 12c.07.67-.45 1.25-1.12 1.25H4.25a1.13 1.13 0 0 1-1.12-1.25l1.26-12A1.13 1.13 0 0 1 5.51 7.5h12.98c.58 0 1.06.44 1.12 1.01Z" />
)
export const IconCart: React.FC<P> = p => (
  <Outline {...p} d="M2.25 3h1.39c.51 0 .95.34 1.09.84l.38 1.43M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.22c1.12-2.3 2.1-4.68 2.92-7.14a60 60 0 0 0-16.53-1.84M7.5 14.25 5.1 5.27M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
)
export const IconCheck: React.FC<P> = p => <Outline {...p} d="m4.5 12.75 6 6 9-13.5" />
export const IconBanknotes: React.FC<P> = p => (
  <Outline {...p} d="M2.25 18.75a60 60 0 0 1 15.8 2.1c.73.2 1.45-.34 1.45-1.1V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.38c0-.62.5-1.12 1.13-1.12H20.25M2.25 6v9m18-10.5v.75c0 .41.34.75.75.75h.75m-1.5-1.5h.38c.62 0 1.12.5 1.12 1.13v9.75c0 .62-.5 1.12-1.12 1.12h-.38m1.5-12v9M3.75 18h-.38A1.13 1.13 0 0 1 2.25 16.88v-.38m19.5 0v.38c0 .62-.5 1.12-1.12 1.12h-.38M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
)

// Glyph kategori untuk area gambar produk (data demo tidak membawa foto lokal)
export const CategoryGlyph: React.FC<{ kind: string; size?: number; color: string }> = ({ kind, size = 64, color }) => {
  const common = { width: size, height: size, viewBox: '0 0 64 64', fill: 'none', stroke: color, strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'Minuman')
    return (
      <svg {...common}>
        <path d="M16 22h28l-3 30a4 4 0 0 1-4 3.6H23a4 4 0 0 1-4-3.6L16 22Z" />
        <path d="M44 28h4a6 6 0 0 1 0 12h-5" />
        <path d="M24 8c-2 3 2 5 0 8M32 8c-2 3 2 5 0 8" />
      </svg>
    )
  if (kind === 'Makanan Berat')
    return (
      <svg {...common}>
        <path d="M8 32h48a24 20 0 0 1-48 0Z" />
        <path d="M20 26c2-6 8-9 12-9s10 3 12 9" />
        <path d="M46 10 34 24M52 14 38 26" />
      </svg>
    )
  if (kind === 'Makanan Ringan')
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="22" />
        <circle cx="32" cy="32" r="7" />
        <path d="M18 22l3 2M42 18l-2 3M46 36l-3-1M24 46l2-3" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M14 24h36l-5 32H19L14 24Z" />
      <path d="M20 24c-2-8 4-14 10-12 2-6 12-6 13 2 6 0 8 6 5 10" />
      <path d="M26 30l2 20M38 30l-2 20" />
    </svg>
  )
}

export const Cursor: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 24 30" style={{ filter: 'drop-shadow(0 4px 6px rgba(15,23,42,0.35))' }}>
    <path d="M2 2v22l6.2-5.6 4.2 9.4 3.8-1.7-4.1-9.2H21L2 2Z" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)

// simple-icons "whatsapp" (paket @iconify-json/simple-icons di project)
export const IconWhatsApp: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = '#25D366' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={color}
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.870 9.870 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.860 9.860 0 0 1-1.510-5.260c.001-5.450 4.436-9.884 9.888-9.884c2.640 0 5.122 1.030 6.988 2.898a9.820 9.820 0 0 1 2.893 6.994c-.003 5.450-4.437 9.884-9.885 9.884m8.413-18.297A11.820 11.820 0 0 0 12.050 0C5.495 0 .160 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.900 11.900 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.820 11.820 0 0 0-3.480-8.413"
    />
  </svg>
)
