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

const ACTIVITY_STORAGE_KEY = 'activity_logs'
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000 // ~3 bulan

export const useActivityLog = () => {
    const { store } = useStore()
    const user = useSupabaseUser()

    const activityLogs = useState<ActivityLog[]>('activity_logs', () => [])
    const loading = useState('activity_logs_loading', () => false)
    const error = useState<string | null>('activity_logs_error', () => null)

    // Clean old logs (> 3 bulan)
    const cleanOldLogs = () => {
        if (typeof window === 'undefined') return

        try {
            const storedData = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            if (!storedData) return

            const logs: ActivityLog[] = JSON.parse(storedData)
            const now = new Date().getTime()
            
            // Filter logs yang masih dalam 3 bulan
            const validLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime()
                return (now - logTime) < THREE_MONTHS_MS
            })

            if (validLogs.length !== logs.length) {
                localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(validLogs))
            }
        } catch (e) {
            console.warn('Error cleaning old logs:', e)
        }
    }

    // Log activity to localStorage
    const logActivity = (action: string, details?: any, relatedId?: string) => {
        if (!store.value || typeof window === 'undefined') return

        try {
            cleanOldLogs()

            const newLog: ActivityLog = {
                id: Math.random().toString(36).substr(2, 9),
                store_id: store.value.id,
                user_id: user.value?.id,
                action,
                details,
                related_id: relatedId || undefined,
                timestamp: new Date().toISOString(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
            }

            const storedData = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            const logs: ActivityLog[] = storedData ? JSON.parse(storedData) : []
            logs.unshift(newLog) // Add to beginning (newest first)
            
            localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(logs))
        } catch (e) {
            console.warn('Error logging activity:', e)
        }
    }

    // Fetch activity logs from localStorage
    const fetchActivityLogs = (filters?: { 
        limit?: number
        offset?: number
        action?: string
        search?: string
        startDate?: string
        endDate?: string
    }): { data: ActivityLog[], total: number, count: number } | [] => {
        if (!store.value || typeof window === 'undefined') return []

        try {
            loading.value = true
            cleanOldLogs()

            const storedData = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            let logs: ActivityLog[] = storedData ? JSON.parse(storedData) : []

            // Filter by store
            logs = logs.filter(log => log.store_id === store.value?.id)

            // Filter by action
            if (filters?.action && filters.action !== 'all') {
                logs = logs.filter(log => log.action === filters.action)
            }

            // Filter by search text (dalam action atau details)
            if (filters?.search) {
                const search = filters.search.toLowerCase()
                logs = logs.filter(log =>
                    log.action.toLowerCase().includes(search) ||
                    JSON.stringify(log.details).toLowerCase().includes(search)
                )
            }

            // Filter by date range
            if (filters?.startDate) {
                const startTime = new Date(filters.startDate).getTime()
                logs = logs.filter(log => new Date(log.timestamp).getTime() >= startTime)
            }
            if (filters?.endDate) {
                const endTime = new Date(filters.endDate).getTime()
                logs = logs.filter(log => new Date(log.timestamp).getTime() <= endTime)
            }

            // Apply pagination
            const offset = filters?.offset || 0
            const limit = filters?.limit || 100
            const paginatedLogs = logs.slice(offset, offset + limit)

            activityLogs.value = paginatedLogs
            loading.value = false
            return {
                data: paginatedLogs,
                total: logs.length,
                count: paginatedLogs.length
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unknown error'
            loading.value = false
            return []
        }
    }

    // Get activity summary
    const getActivitySummary = (days: number = 7) => {
        if (!store.value || typeof window === 'undefined') return {}

        try {
            const storedData = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            let logs: ActivityLog[] = storedData ? JSON.parse(storedData) : []

            // Filter by store and date
            logs = logs.filter(log => {
                if (log.store_id !== store.value?.id) return false
                const daysAgo = new Date()
                daysAgo.setDate(daysAgo.getDate() - days)
                return new Date(log.timestamp) >= daysAgo
            })

            // Count by action
            const summary: Record<string, number> = {}
            logs.forEach(log => {
                summary[log.action] = (summary[log.action] || 0) + 1
            })

            return summary
        } catch (e) {
            console.warn('Error getting activity summary:', e)
            return {}
        }
    }

    // Clear old logs manually
    const clearOldLogs = () => {
        cleanOldLogs()
    }

    // Export logs as JSON
    const exportLogs = () => {
        try {
            const storedData = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            const logs: ActivityLog[] = storedData ? JSON.parse(storedData) : []
            const storeId = store.value?.id
            const storeLogs = logs.filter(log => log.store_id === storeId)
            
            const dataStr = JSON.stringify(storeLogs, null, 2)
            const dataBlob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`
            link.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.warn('Error exporting logs:', e)
        }
    }

    return {
        activityLogs,
        loading,
        error,
        logActivity,
        fetchActivityLogs,
        getActivitySummary,
        clearOldLogs,
        exportLogs
    }
}
