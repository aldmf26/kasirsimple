/**
 * Activity Logger Utility
 * Simple helper untuk log activities ke localStorage
 * Usage: logToActivity('TRANSACTION_DELETED', { trxNumber: '123' }, 'txn-id-123')
 */

const ACTIVITY_STORAGE_KEY = 'activity_logs'
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000

const createLogId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }

    return Math.random().toString(36).slice(2, 11)
}

const pruneOldLocalLogs = (logs: ActivityLog[]) => {
    const now = Date.now()
    return logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime()
        return !Number.isNaN(logTime) && (now - logTime) < THREE_MONTHS_MS
    })
}

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
    if (!storeId) return

    try {
        const newLog: ActivityLog = {
            id: createLogId(),
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

        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(pruneOldLocalLogs(logs)))

        // Fire-and-forget DB audit log. Local log stays as fallback when network/RLS fails.
        try {
            const supabase = useSupabaseClient()
            supabase
                .from('activity_logs')
                .insert({
                    id: newLog.id,
                    store_id: storeId,
                    user_id: userId,
                    action,
                    details,
                    related_id: relatedId,
                    timestamp: newLog.timestamp,
                    user_agent: newLog.user_agent
                } as any)
                .then(({ error }) => {
                    if (error) console.warn('Error saving remote activity:', error.message)
                })
        } catch (e) {
            console.warn('Remote activity logger unavailable:', e)
        }
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

    // Expenses
    EXPENSE_CREATED: 'EXPENSE_CREATED',
    EXPENSE_DELETED: 'EXPENSE_DELETED',

    // System
    STORE_SETTINGS_UPDATED: 'STORE_SETTINGS_UPDATED',
    BACKUP_EXPORTED: 'BACKUP_EXPORTED',
    BACKUP_IMPORTED: 'BACKUP_IMPORTED',
    ACCOUNT_DATA_DELETED: 'ACCOUNT_DATA_DELETED',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    CASH_REGISTER_OPENED: 'CASH_REGISTER_OPENED',
    CASH_REGISTER_CLOSED: 'CASH_REGISTER_CLOSED',
}
