import { formatCurrency } from './helpers'

export type SaleMode = 'unit' | 'weight'
export type StockUnit = 'pcs' | 'gram'

export interface SaleItemLike {
  product_name?: string | null
  product_price?: number | string | null
  quantity?: number | string | null
  subtotal?: number | string | null
  sale_mode?: string | null
  weight_grams?: number | string | null
  product_unit?: string | null
}

export interface ReceiptItemParts {
  title: string
  detail: string
  total: number
}

/**
 * Weight lines are priced per kg while the input is grams.
 * Rounded half-up to the nearest rupiah per line:
 *   subtotal = floor((grams * pricePerKg + 500) / 1000)
 */
export const calcWeightSubtotal = (
  grams: number,
  pricePerKg: number
): number => {
  const weight = Math.round(Number(grams))
  const price = Number(pricePerKg)

  if (!Number.isFinite(weight) || !Number.isFinite(price)) return 0
  if (weight <= 0 || price < 0) return 0

  return Math.floor((weight * price + 500) / 1000)
}

/** 750 -> "0,750 kg" */
export const formatWeight = (grams: number): string => {
  const value = Number(grams)
  const weight = Number.isFinite(value) && value > 0 ? value : 0
  return `${(weight / 1000).toFixed(3).replace('.', ',')} kg`
}

/** Weight in kilograms as a number, e.g. 750 -> 0.75 */
export const weightInKg = (grams: number): number => {
  const value = Number(grams)
  return Number.isFinite(value) && value > 0 ? value / 1000 : 0
}

export const isValidWeight = (grams: number): boolean => {
  const weight = Number(grams)
  return Number.isFinite(weight) && Number.isInteger(weight) && weight > 0
}

/** Live stock check for a weight line. Stock is stored in grams. */
export const validateWeightStock = (
  grams: number,
  stockGrams: number
): string | null => {
  if (!isValidWeight(grams)) return 'Berat harus lebih dari 0 gram'

  const stock = Number(stockGrams)
  if (Number.isFinite(stock) && grams > stock) {
    return `Stok tidak cukup (tersisa ${formatWeight(stock)})`
  }

  return null
}

export const isWeightItem = (item: SaleItemLike): boolean =>
  item.sale_mode === 'weight'
  || (item.weight_grams !== null && item.weight_grams !== undefined)

const toNumber = (value: unknown): number => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

/**
 * Single source of truth for receipt lines across web, thermal and Bluetooth.
 * Unit lines keep the old "2x Kopi" shape; weight lines show grams and price/kg.
 */
export const getReceiptItemParts = (
  item: SaleItemLike
): ReceiptItemParts => {
  const name = item.product_name || 'Item'
  const price = toNumber(item.product_price)
  const quantity = toNumber(item.quantity) || 1

  if (isWeightItem(item)) {
    const grams = toNumber(item.weight_grams)
    const weightLabel = formatWeight(grams)
    const fallback = calcWeightSubtotal(grams, price)

    return {
      title: `${weightLabel} ${name}`,
      detail: `${weightLabel} × ${formatCurrency(price)}/kg`,
      total: toNumber(item.subtotal) || fallback
    }
  }

  const unit = item.product_unit || 'pcs'

  return {
    title: `${quantity}x ${name}`,
    detail: `${quantity} ${unit} × ${formatCurrency(price)}`,
    total: toNumber(item.subtotal) || price * quantity
  }
}

export const formatReceiptLine = (item: SaleItemLike): string => {
  const { title, detail } = getReceiptItemParts(item)
  return `${title}\n   ${detail}`
}

/** Stock amount to deduct/restore: grams for weight lines, quantity otherwise. */
export const getStockQuantity = (item: {
  sale_mode?: string | null
  weight_grams?: number | string | null
  quantity?: number | string | null
}): number =>
  isWeightItem(item as SaleItemLike)
    ? toNumber(item.weight_grams)
    : toNumber(item.quantity)

/** Display stock in its stored unit: "0,750 kg" for gram stock, "12 pcs" otherwise. */
export const formatStock = (stock: number, stockUnit?: string | null): string =>
  stockUnit === 'gram'
    ? formatWeight(stock)
    : `${toNumber(stock).toLocaleString('id-ID')} ${stockUnit || 'pcs'}`

export type StockLevel = 'untracked' | 'out' | 'low' | 'ok'

/** Default warning threshold in the product's stock unit: 5 pcs or 500 gram. */
export const defaultMinStock = (stockUnit?: string | null): number =>
  stockUnit === 'gram' ? 500 : 5

export const lowStockThreshold = (product: { min_stock?: number | null, stock_unit?: string | null }): number =>
  product.min_stock ?? defaultMinStock(product.stock_unit)

/** 'low' = at or below min_stock but not empty; min_stock 0 means only warn when empty. */
export const stockLevel = (product: {
  has_stock?: boolean | null
  stock?: number | null
  min_stock?: number | null
  stock_unit?: string | null
}): StockLevel => {
  if (product.has_stock === false) return 'untracked'
  const stock = toNumber(product.stock)
  if (stock <= 0) return 'out'
  return stock <= lowStockThreshold(product) ? 'low' : 'ok'
}

/** Low or empty tracked stock: what "Barang Mau Habis" and the menu badge count. */
export const needsRestock = (product: Parameters<typeof stockLevel>[0]): boolean => {
  const level = stockLevel(product)
  return level === 'low' || level === 'out'
}

/** Most urgent first: empty, then lowest stock relative to its threshold. */
export const sortByStockUrgency = <T extends { stock?: number | null, min_stock?: number | null, stock_unit?: string | null }>(items: T[]): T[] =>
  [...items].sort((a, b) =>
    toNumber(a.stock) / Math.max(1, lowStockThreshold(a)) - toNumber(b.stock) / Math.max(1, lowStockThreshold(b)))
