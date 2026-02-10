import type { Database } from '~/types/database'

type Store = Database['public']['Tables']['stores']['Row']
type StoreInsert = Database['public']['Tables']['stores']['Insert']
type StoreUpdate = Database['public']['Tables']['stores']['Update']

export const useStore = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const { isDummyMode, getDummyStore } = useDummyMode()

    const store = useState<Store | null>('current_store', () => null)
    const loading = useState('store_loading', () => false)
    const error = useState<string | null>('store_error', () => null)

    // Prevent concurrent fetches
    let fetchInProgress = false

    // Fetch current user's store
    const fetchStore = async (userId?: string) => {
        // Prevent concurrent fetches
        if (fetchInProgress) {
            return
        }

        // Skip on server-side to avoid hydration issues
        if (process.server) {
            return null;
        }

        // Use dummy data if dummy mode is enabled
        if (isDummyMode.value) {
            loading.value = true
            try {
                const dummyStore = getDummyStore()
                store.value = dummyStore as unknown as Store
                return dummyStore
            } finally {
                loading.value = false
            }
        }

        // Get user ID from parameter OR from reactive user object
        const targetUserId = userId || user.value?.id

        if (!targetUserId) {
            store.value = null;
            return null;
        }
        fetchInProgress = true
        loading.value = true;
        error.value = null;

        try {
            // Priority: Fetch active store for current user
            const targetUserId = userId || user.value?.id;

            if (!targetUserId) {
                store.value = null;
                return null;
            }

            const { data, error: fetchError } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', targetUserId)
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                store.value = data;
            } else {
                store.value = null;
            }

            return data;
        } catch (e: any) {
            console.error('Error fetching store:', e.message);
            error.value = e.message;
            return null;
        } finally {
            fetchInProgress = false
            loading.value = false;
        }
    };

    // Create a new store
    const createStore = async (storeData: StoreInsert) => {
        if (!user.value) throw new Error('User not authenticated')

        loading.value = true
        error.value = null

        try {
            const { data, error: createError } = await (supabase
                .from('stores') as any)
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
            const { data, error: updateError } = await (supabase
                .from('stores') as any)
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

    // Auto-fetch store when user becomes available
    const initStoreAutoFetch = () => {
        // Only run on client-side
        if (process.client) {
            // Use onAuthStateChange to reliably detect auth events
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session?.user?.id) {
                    fetchStore(session.user.id)
                } else if (event === 'SIGNED_OUT') {
                    store.value = null
                } else if (event === 'INITIAL_SESSION' && session?.user?.id) {
                    fetchStore(session.user.id)
                }
            })

            // Cleanup subscription on component unmount
            onBeforeUnmount(() => {
                subscription?.unsubscribe()
            })
        }
    }

    // Initialize auto-fetch
    initStoreAutoFetch()

    return {
        store,
        loading,
        error,
        fetchStore,
        createStore,
        updateStore
    }
}
