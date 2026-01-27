import type { Database } from '~/types/database'

type Store = Database['public']['Tables']['stores']['Row']
type StoreInsert = Database['public']['Tables']['stores']['Insert']
type StoreUpdate = Database['public']['Tables']['stores']['Update']

export const useStore = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    const store = useState<Store | null>('current_store', () => null)
    const loading = useState('store_loading', () => false)
    const error = useState<string | null>('store_error', () => null)

    // Fetch current user's store
    const fetchStore = async () => {
        if (!user.value) return null

        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', user.value.id)
                .eq('is_active', true)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError
            }

            store.value = data
            return data
        } catch (e: any) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    // Create a new store
    const createStore = async (storeData: StoreInsert) => {
        if (!user.value) throw new Error('User not authenticated')

        loading.value = true
        error.value = null

        try {
            const { data, error: createError } = await supabase
                .from('stores')
                .insert({
                    ...storeData,
                    user_id: user.value.id
                })
                .select()
                .single()

            if (createError) throw createError

            store.value = data
            return data
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Update store
    const updateStore = async (storeId: string, storeData: StoreUpdate) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('stores')
                .update({
                    ...storeData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', storeId)
                .select()
                .single()

            if (updateError) throw updateError

            store.value = data
            return data
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        store,
        loading,
        error,
        fetchStore,
        createStore,
        updateStore
    }
}
