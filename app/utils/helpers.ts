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

// ISO bounds (UTC instants) of local calendar days, for created_at filters.
export const localDayStartISO = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
    return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

export const localDayEndISO = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number]
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

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
