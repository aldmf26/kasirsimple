import { describe, expect, it } from 'vitest'
import {
  calcWeightSubtotal,
  formatReceiptLine,
  formatWeight,
  getReceiptItemParts,
  isValidWeight,
  needsRestock,
  sortByStockUrgency,
  stockLevel,
  validateWeightStock,
  weightInKg
} from '../app/utils/pricing'

describe('calcWeightSubtotal', () => {
  it('harga per kg x berat bulat', () => {
    expect(calcWeightSubtotal(750, 30000)).toBe(22500)
    expect(calcWeightSubtotal(1250, 30000)).toBe(37500)
    expect(calcWeightSubtotal(1000, 30000)).toBe(30000)
  })

  it('membulatkan half-up ke rupiah terdekat', () => {
    // 333 g x Rp12.345/kg = Rp4.110,885 -> Rp4.111
    expect(calcWeightSubtotal(333, 12345)).toBe(4111)
    // 500 g x Rp12.345/kg = Rp6.172,5 -> Rp6.173
    expect(calcWeightSubtotal(500, 12345)).toBe(6173)
    // 1 g x Rp500/kg = Rp0,5 -> Rp1
    expect(calcWeightSubtotal(1, 500)).toBe(1)
  })

  it('menolak input tidak valid tanpa melempar error', () => {
    expect(calcWeightSubtotal(0, 30000)).toBe(0)
    expect(calcWeightSubtotal(-500, 30000)).toBe(0)
    expect(calcWeightSubtotal(750, -1)).toBe(0)
    expect(calcWeightSubtotal(Number.NaN, 30000)).toBe(0)
    expect(calcWeightSubtotal(750, Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('harga nol tetap nol', () => {
    expect(calcWeightSubtotal(750, 0)).toBe(0)
  })
})

describe('formatWeight', () => {
  it('memakai 3 desimal dan koma Indonesia', () => {
    expect(formatWeight(750)).toBe('0,750 kg')
    expect(formatWeight(1250)).toBe('1,250 kg')
    expect(formatWeight(11000)).toBe('11,000 kg')
  })

  it('nilai tidak valid menjadi 0,000 kg', () => {
    expect(formatWeight(0)).toBe('0,000 kg')
    expect(formatWeight(-100)).toBe('0,000 kg')
    expect(formatWeight(Number.NaN)).toBe('0,000 kg')
  })

  it('weightInKg mengembalikan angka kilogram', () => {
    expect(weightInKg(750)).toBe(0.75)
    expect(weightInKg(0)).toBe(0)
  })
})

describe('isValidWeight', () => {
  it('hanya menerima gram bulat positif', () => {
    expect(isValidWeight(750)).toBe(true)
    expect(isValidWeight(0)).toBe(false)
    expect(isValidWeight(-1)).toBe(false)
    expect(isValidWeight(750.5)).toBe(false)
    expect(isValidWeight(Number.NaN)).toBe(false)
  })
})

describe('validateWeightStock', () => {
  it('menolak berat di atas stok', () => {
    expect(validateWeightStock(750, 500)).toBe(
      'Stok tidak cukup (tersisa 0,500 kg)'
    )
  })

  it('menerima berat yang masih tersedia', () => {
    expect(validateWeightStock(750, 750)).toBeNull()
    expect(validateWeightStock(750, 1000)).toBeNull()
  })

  it('menolak berat tidak valid', () => {
    expect(validateWeightStock(0, 1000)).toBe('Berat harus lebih dari 0 gram')
  })
})

describe('getReceiptItemParts', () => {
  it('baris timbang memakai berat dan harga per kg', () => {
    const parts = getReceiptItemParts({
      product_name: 'Telur Ayam Negeri',
      product_price: 30000,
      quantity: 1,
      subtotal: 22500,
      sale_mode: 'weight',
      weight_grams: 750,
      product_unit: 'kg'
    })

    expect(parts.title).toBe('0,750 kg Telur Ayam Negeri')
    expect(parts.detail).toBe('0,750 kg × Rp 30.000/kg')
    expect(parts.total).toBe(22500)
  })

  it('memakai subtotal final saat harga diedit kasir', () => {
    const parts = getReceiptItemParts({
      product_name: 'Telur Ceplok',
      product_price: 13000,
      quantity: 1,
      subtotal: 9750,
      sale_mode: 'weight',
      weight_grams: 750
    })

    expect(parts.total).toBe(9750)
    expect(parts.detail).toContain('Rp 13.000/kg')
  })

  it('baris satuan tetap memakai format lama', () => {
    const parts = getReceiptItemParts({
      product_name: 'Kopi',
      product_price: 10000,
      quantity: 2,
      subtotal: 20000,
      product_unit: 'pcs'
    })

    expect(parts.title).toBe('2x Kopi')
    expect(parts.detail).toBe('2 pcs × Rp 10.000')
    expect(parts.total).toBe(20000)
  })

  it('data lama tanpa sale_mode dianggap satuan', () => {
    const parts = getReceiptItemParts({
      product_name: 'Teh',
      product_price: 5000,
      quantity: 3,
      subtotal: 15000
    })

    expect(parts.title).toBe('3x Teh')
    expect(parts.detail).toBe('3 pcs × Rp 5.000')
  })

  it('fallback total dihitung saat subtotal kosong', () => {
    const weight = getReceiptItemParts({
      product_name: 'Telur',
      product_price: 30000,
      weight_grams: 750,
      sale_mode: 'weight'
    })
    expect(weight.total).toBe(22500)

    const unit = getReceiptItemParts({
      product_name: 'Kopi',
      product_price: 10000,
      quantity: 2
    })
    expect(unit.total).toBe(20000)
  })

  it('formatReceiptLine menggabungkan judul dan detail', () => {
    expect(
      formatReceiptLine({
        product_name: 'Telur',
        product_price: 30000,
        weight_grams: 750,
        sale_mode: 'weight'
      })
    ).toBe('0,750 kg Telur\n   0,750 kg × Rp 30.000/kg')
  })
})

describe('stockLevel', () => {
  it('uses min_stock as-is, including 0', () => {
    expect(stockLevel({ has_stock: true, stock: 3, min_stock: 5 })).toBe('low')
    expect(stockLevel({ has_stock: true, stock: 3, min_stock: 0 })).toBe('ok')
    expect(stockLevel({ has_stock: true, stock: 0, min_stock: 0 })).toBe('out')
  })

  it('defaults to 500 gram for weight stock and 5 for pcs', () => {
    expect(stockLevel({ has_stock: true, stock: 400, stock_unit: 'gram', min_stock: null })).toBe('low')
    expect(stockLevel({ has_stock: true, stock: 600, stock_unit: 'gram', min_stock: null })).toBe('ok')
    expect(stockLevel({ has_stock: true, stock: 5, stock_unit: 'pcs', min_stock: null })).toBe('low')
  })

  it('ignores products without stock tracking', () => {
    expect(stockLevel({ has_stock: false, stock: 0 })).toBe('untracked')
  })
})

describe('sortByStockUrgency', () => {
  it('puts empty and relatively lowest first', () => {
    const items = [
      { id: 'a', stock: 4, min_stock: 5 },
      { id: 'b', stock: 0, min_stock: 5 },
      { id: 'c', stock: 300, min_stock: 500, stock_unit: 'gram' },
    ]
    expect(sortByStockUrgency(items).map(i => i.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('needsRestock', () => {
  it('is true for low or empty tracked stock only', () => {
    expect(needsRestock({ has_stock: true, stock: 0, min_stock: 5 })).toBe(true)
    expect(needsRestock({ has_stock: true, stock: 3, min_stock: 5 })).toBe(true)
    expect(needsRestock({ has_stock: true, stock: 9, min_stock: 5 })).toBe(false)
    expect(needsRestock({ has_stock: false, stock: 0 })).toBe(false)
  })
})
