import type { Database } from '~/types/database'

export const useAdmin = () => {
    const supabase = useSupabaseClient<Database>()
    const { store: currentStore } = useStore()

    const allStores = useState<any[]>('admin_all_stores', () => [])
    const loading = useState('admin_loading', () => false)

    const isAdmin = computed(() => {
        // TEMPORARY: Open for everyone to review the UI
        // return true
        return (currentStore.value as any)?.is_admin === true
    })

    const fetchAllStores = async () => {
        if (!isAdmin.value) return []

        loading.value = true
        try {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            allStores.value = data || []
            return data
        } catch (e: any) {
            console.error('Error fetching all stores:', e.message)
            return []
        } finally {
            loading.value = false
        }
    }

    const updateStoreSubscription = async (storeId: string, data: { subscription_until: string, subscription_status: string, subscription_plan: string }) => {
        if (!isAdmin.value) return

        loading.value = true
        try {
            const { error } = await supabase
                .from('stores')
                .update(data)
                .eq('id', storeId)

            if (error) throw error

            // Refresh local state
            await fetchAllStores()
        } catch (e: any) {
            console.error('Error updating subscription:', e.message)
            throw e
        } finally {
            loading.value = false
        }
    }

    const getStoreReport = async (storeId: string) => {
        if (!isAdmin.value) return null

        try {
            // Get last 30 days revenue
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('total, created_at')
                .eq('store_id', storeId)
                .gte('created_at', thirtyDaysAgo.toISOString())

            if (error) throw error

            const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total || 0), 0) || 0
            const transactionCount = transactions?.length || 0

            return {
                totalRevenue,
                transactionCount,
                lastTransaction: transactions && transactions.length > 0 ? transactions[0].created_at : null
            }
        } catch (e: any) {
            console.error('Error fetching store report:', e.message)
            return null
        }
    }

    return {
        isAdmin,
        allStores,
        loading,
        fetchAllStores,
        updateStoreSubscription,
        getStoreReport
    }
}
