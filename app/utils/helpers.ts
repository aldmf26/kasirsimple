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
