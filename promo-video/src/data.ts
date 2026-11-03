// Diambil dari app/utils/dummyData.json (data demo resmi project) dan app/utils/helpers.ts
export const STORE_NAME = 'Toko Demo Kasir'

export const CATEGORIES = ['Semua', 'Minuman', 'Makanan Ringan', 'Makanan Berat', 'Snack']

export const CATEGORY_TINT: Record<string, { bg: string; fg: string }> = {
  Minuman: { bg: '#DBEAFE', fg: '#2563EB' }, // color: blue
  'Makanan Ringan': { bg: '#FEF3C7', fg: '#D97706' }, // color: amber
  'Makanan Berat': { bg: '#DCFCE7', fg: '#16A34A' }, // color: green
  Snack: { bg: '#FEE2E2', fg: '#DC2626' } // color: red
}

export const PRODUCTS = [
  { name: 'Kopi Hitam', price: 10000, stock: 50, category: 'Minuman' },
  { name: 'Teh Tarik', price: 12000, stock: 45, category: 'Minuman' },
  { name: 'Jus Jeruk', price: 15000, stock: 30, category: 'Minuman' },
  { name: 'Donut Coklat', price: 8000, stock: 60, category: 'Makanan Ringan' },
  { name: 'Roti Tawar', price: 25000, stock: 20, category: 'Makanan Ringan' },
  { name: 'Nasi Goreng', price: 35000, stock: 25, category: 'Makanan Berat' },
  { name: 'Mie Goreng', price: 30000, stock: 35, category: 'Makanan Berat' },
  { name: 'Soto Ayam', price: 28000, stock: 40, category: 'Makanan Berat' },
  { name: 'Keripik Singkong', price: 12000, stock: 100, category: 'Snack' },
  { name: 'Kacang Mete', price: 18000, stock: 75, category: 'Snack' }
]

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Kartu Bank']

export const CTA_WHATSAPP = '0895-4131-11053'
