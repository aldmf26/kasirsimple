// Format currency to Indonesian Rupiah
export const formatCurrency = (value: number, currency: string = 'Rp'): string => {
    return `${currency} ${value.toLocaleString('id-ID')}`
}

// Format date to Indonesian format
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

// Format datetime to Indonesian format
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Format time only
export const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Generate short ID
export const generateShortId = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

// Parse number from string input
export const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
    return parseInt(cleaned, 10) || 0
}

// Format number input (for currency fields)
export const formatNumberInput = (value: number): string => {
    return value.toLocaleString('id-ID')
}

// Calculate discount
export const calculateDiscount = (
    subtotal: number,
    discount: number,
    type: 'nominal' | 'percent'
): number => {
    if (type === 'percent') {
        return Math.round(subtotal * (discount / 100))
    }
    return discount
}

// Get today's date range
export const getTodayRange = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    return {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
    }
}

// Get this month's date range
export const getMonthRange = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    return {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString()
    }
}

// Color palette for categories
export const categoryColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
]

// Payment methods
export const paymentMethods = [
    { value: 'cash', label: 'Tunai', icon: 'i-heroicons-banknotes', isToggleable: false },
    { value: 'qris', label: 'QRIS', icon: 'i-heroicons-qr-code', isToggleable: false },
    { value: 'card', label: 'Kartu Bank', icon: 'i-heroicons-credit-card', isToggleable: true },
]

// Business types
export const businessTypes = [
    { value: 'retail', label: 'Retail / Toko', description: 'Toko dengan stok produk', icon: '🏪' },
    { value: 'service', label: 'Jasa / Service', description: 'Layanan tanpa stok', icon: '⚙️' },
    { value: 'fnb', label: 'F&B / Resto', description: 'Resto, cafe, warung makan', icon: '🍽️' },
]

// Local (device timezone) calendar date as YYYY-MM-DD. toISOString() gives the UTC
// date, which is "yesterday" before 07:00 WIB.
export const localDateKey = (date: Date | string = new Date()): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// "YYYY-MM-DD" -> local Date at the given time of day.
const parseDateKey = (dateKey: string, h = 0, min = 0, sec = 0, ms = 0): Date => {
    const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
    return new Date(y, m - 1, d, h, min, sec, ms)
}

// ISO bounds (UTC instants) of local calendar days, for created_at filters.
export const localDayStartISO = (dateKey: string): string => parseDateKey(dateKey).toISOString()

export const localDayEndISO = (dateKey: string): string => parseDateKey(dateKey, 23, 59, 59, 999).toISOString()

// Returned transactions use the status column; the "[RETUR]" notes prefix is
// only a fallback for rows read before migration 023 ran.
export const isReturnedTransaction = (t: { status?: string | null, notes?: string | null }): boolean =>
    t.status ? t.status === 'returned' : (t.notes || '').startsWith('[RETUR]')

// Next TRX-YYYYMMDD-NNN after the highest existing number with that prefix.
export const nextTransactionNumber = (dateKey: string, existingNumbers: string[]): string => {
    const prefix = `TRX-${dateKey.replace(/-/g, '')}-`
    const maxSeq = existingNumbers
        .filter(n => n?.startsWith(prefix))
        .map(n => parseInt(n.slice(prefix.length), 10))
        .filter(n => Number.isFinite(n))
        .reduce((max, n) => Math.max(max, n), 0)
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
}

export const clampNumber = (value: unknown, min: number, max: number): number => {
    const n = Number(value)
    if (!Number.isFinite(n)) return min
    return Math.min(max, Math.max(min, n))
}

// Supabase/PostgREST returns at most 1000 rows per request; page through all of them.
// `build(from, to)` must return a query with a stable .order() and .range(from, to).
export const fetchAllRows = async <T = any>(
    build: (from: number, to: number) => PromiseLike<{ data: T[] | null, error: any }>,
    pageSize = 1000
): Promise<T[]> => {
    const rows: T[] = []
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await build(from, from + pageSize - 1)
        if (error) throw error
        rows.push(...(data || []))
        if (!data || data.length < pageSize) return rows
    }
}

// Split long id lists so `.in(...)` URLs stay under server limits.
export const chunkArray = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
    return chunks
}

export interface SalesTrendRow {
    key: string        // YYYY-MM-DD or YYYY-MM
    label: string      // short axis label: "26/10" or "Okt"
    fullLabel: string  // "Senin, 26 Okt 2026" or "Oktober 2026"
    sales: number
}

// Longer ranges are charted per month so bars stay readable on a phone.
const TREND_MONTHLY_AFTER_DAYS = 62
const DAY_MS = 86_400_000

// Sales per local day (or per month for ranges over TREND_MONTHLY_AFTER_DAYS) across the whole
// selected range, with 0 for periods without sales so the trend is not compressed.
export const buildSalesTrend = (
    transactions: { created_at: string, total: number | string | null }[],
    startKey: string,
    endKey: string,
): { unit: 'day' | 'month', rows: SalesTrendRow[] } => {
    const start = parseDateKey(startKey)
    const end = parseDateKey(endKey)
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
    const unit: 'day' | 'month' = days > TREND_MONTHLY_AFTER_DAYS ? 'month' : 'day'
    const keyOf = (date: Date | string) => localDateKey(date).slice(0, unit === 'day' ? 10 : 7)

    const totals = new Map<string, number>()
    for (const t of transactions) {
        const key = keyOf(t.created_at)
        totals.set(key, (totals.get(key) || 0) + (Number(t.total) || 0))
    }

    const multiYear = start.getFullYear() !== end.getFullYear()
    const rows: SalesTrendRow[] = []
    if (unit === 'day') {
        for (let i = 0; i < Math.max(days, 0); i++) {
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
            const key = keyOf(d)
            rows.push({
                key,
                label: `${d.getDate()}/${d.getMonth() + 1}`,
                fullLabel: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
                sales: totals.get(key) || 0,
            })
        }
    } else {
        for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
            const key = keyOf(d)
            const month = d.toLocaleDateString('id-ID', { month: 'short' })
            rows.push({
                key,
                label: multiYear ? `${month} ${String(d.getFullYear()).slice(2)}` : month,
                fullLabel: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
                sales: totals.get(key) || 0,
            })
        }
    }
    return { unit, rows }
}

export type ReportPeriod = 'today' | 'week' | 'month' | 'month30' | 'year' | 'custom'

// The period a report range is compared with. Calendar periods compare with the
// same days of the previous month/year ("1-5 Nov" vs "1-5 Okt"); everything else
// with the equally long stretch right before it.
export const previousPeriod = (
    startKey: string,
    endKey: string,
    period: ReportPeriod,
): { start: string, end: string, label: string } => {
    const start = parseDateKey(startKey)
    const end = parseDateKey(endKey)
    const shiftCalendar = (d: Date, months: number) => {
        // Clamp: 31 Mar minus one month is 28/29 Feb, not 3 Mar.
        const lastDay = new Date(d.getFullYear(), d.getMonth() + months + 1, 0).getDate()
        return new Date(d.getFullYear(), d.getMonth() + months, Math.min(d.getDate(), lastDay))
    }

    if (period === 'month' || period === 'year') {
        const months = period === 'month' ? -1 : -12
        return {
            start: localDateKey(shiftCalendar(start, months)),
            end: localDateKey(shiftCalendar(end, months)),
            label: period === 'month' ? 'bulan lalu' : 'tahun lalu',
        }
    }

    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1)
    const prevStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - days)
    return {
        start: localDateKey(prevStart),
        end: localDateKey(prevEnd),
        label: days === 1 ? (period === 'today' ? 'kemarin' : 'hari sebelumnya') : `${days} hari sebelumnya`,
    }
}

// Percent change for the "▲ 12%" badge; null when there is nothing to compare with.
export const percentChange = (current: number, previous: number): number | null =>
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
