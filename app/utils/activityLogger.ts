/**
 * Activity Logger Utility
 * Simple helper untuk log activities ke localStorage
 * Usage: logToActivity('TRANSACTION_DELETED', { trxNumber: '123' }, 'txn-id-123')
 */

const ACTIVITY_STORAGE_KEY = 'activity_logs'
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000

export interface ActivityLog {
    id: string
    store_id: string
    user_id?: string
    action: string
    details?: any
    related_id?: string
    timestamp: string
    user_agent?: string
}

/**
 * Log activity to localStorage
 * @param storeId - Store ID
 * @param action - Action name (e.g., 'TRANSACTION_DELETED')
 * @param details - Activity details (any object)
 * @param relatedId - Related entity ID
 * @param userId - User ID (optional)
 */
export function logToActivity(
    storeId: string,
    action: string,
    details?: any,
    relatedId?: string,
    userId?: string
) {
    try {
        const newLog: ActivityLog = {
            id: Math.random().toString(36).substr(2, 9),
            store_id: storeId,
            user_id: userId,
            action,
            details,
            related_id: relatedId,
            timestamp: new Date().toISOString(),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        }

        const storedData = localStorage.getItem(ACTIVITY_STORAGE_KEY)
        const logs: ActivityLog[] = storedData ? JSON.parse(storedData) : []
        logs.unshift(newLog)

        // Keep only last 3 months
        const now = new Date().getTime()
        const validLogs = logs.filter(log => {
            const logTime = new Date(log.timestamp).getTime()
            return (now - logTime) < THREE_MONTHS_MS
        })

        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(validLogs))
    } catch (e) {
        console.warn('Error logging activity:', e)
    }
}

/**
 * Common activity actions
 */
export const ACTIVITY_TYPES = {
    // Transactions
    TRANSACTION_CREATED: 'TRANSACTION_CREATED',
    TRANSACTION_DELETED: 'TRANSACTION_DELETED',
    TRANSACTION_REFUNDED: 'TRANSACTION_REFUNDED',

    // Products
    PRODUCT_CREATED: 'PRODUCT_CREATED',
    PRODUCT_UPDATED: 'PRODUCT_UPDATED',
    PRODUCT_DELETED: 'PRODUCT_DELETED',

    // Stock
    STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
    STOCK_IN: 'STOCK_IN',
    STOCK_OUT: 'STOCK_OUT',

    // Categories
    CATEGORY_CREATED: 'CATEGORY_CREATED',
    CATEGORY_UPDATED: 'CATEGORY_UPDATED',
    CATEGORY_DELETED: 'CATEGORY_DELETED',

    // System
    STORE_SETTINGS_UPDATED: 'STORE_SETTINGS_UPDATED',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    CASH_REGISTER_OPENED: 'CASH_REGISTER_OPENED',
    CASH_REGISTER_CLOSED: 'CASH_REGISTER_CLOSED',
}
