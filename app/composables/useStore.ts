import type { Database } from '~/types/database'

type Store = Database['public']['Tables']['stores']['Row']
type StoreInsert = Database['public']['Tables']['stores']['Insert']
type StoreUpdate = Database['public']['Tables']['stores']['Update']
type PrinterSettings = Database['public']['Tables']['printer_settings']['Row']

export const useStore = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const { isDummyMode, getDummyStore } = useDummyMode()

    const store = useState<Store | null>('current_store', () => null)
    const printerSettings = useState<PrinterSettings | null>('printer_settings', () => null)
    const loading = useState('store_loading', () => false)
    const error = useState<string | null>('store_error', () => null)

    // Fetch printer settings for the store
    const fetchPrinterSettings = async (storeId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('printer_settings')
                .select('*')
                .eq('store_id', storeId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                printerSettings.value = data;
            } else {
                // Return default settings if none exist
                printerSettings.value = {
                    id: '',
                    store_id: storeId,
                    printer_type: 'thermal',
                    paper_width: 58,
                    auto_print: false,
                    include_logo: true,
                    include_store_info: true,
                    footer_text: 'Terima kasih atas kunjungan Anda!',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            }
            return printerSettings.value;
        } catch (e: any) {
            console.error('Error fetching printer settings:', e.message);
            return null;
        }
    };

    // Fetch current user's store
    const fetchStore = async (userId?: string) => {
        // Skip on server-side
        if (process.server) return null;

        // Use dummy data if dummy mode is enabled
        if (isDummyMode.value) {
            const dummyStore = getDummyStore()
            store.value = dummyStore as unknown as Store
            return dummyStore
        }

        try {
            loading.value = true;
            error.value = null;

            // Priority: Fetch active store for current user
            const targetUserId = userId || user.value?.id;

            if (!targetUserId) {
                store.value = null;
                return null;
            }

            const { data, error: fetchError } = await (supabase
                .from('stores') as any)
                .select('*')
                .eq('user_id', targetUserId)
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                store.value = data;
                // Fetch printer settings once store is loaded
                await fetchPrinterSettings(data.id);
            } else {
                store.value = null;
            }

            return data;
        } catch (e: any) {
            error.value = e.message;
            return null;
        } finally {
            loading.value = false;
        }
    };

    // Create a new store
    const createStore = async (storeData: StoreInsert) => {
        if (!user.value) throw new Error('User not authenticated')

        loading.value = true
        error.value = null

        try {
            // Safety check: Ensure user doesn't already have a store
            // Query manually to avoid messing with current 'store' state
            const { data: existingStore } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', user.value.id)
                .limit(1)
                .maybeSingle()

            if (existingStore) {
                console.log("Store already exists, preventing duplicate creation.");
                store.value = existingStore;
                return existingStore;
            }

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

    // Subscription Logic
    const isSubscriptionActive = computed(() => {
        if (!store.value) return true // Default true during loading to avoid flicker
        if (!store.value.subscription_until) return true

        const now = new Date()
        const until = new Date(store.value.subscription_until)
        return until > now
    })

    const subscriptionDaysLeft = computed(() => {
        if (!store.value || !store.value.subscription_until) return 0
        const now = new Date()
        const until = new Date(store.value.subscription_until)
        const diffTime = until.getTime() - now.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    })

    const isSubscriptionExpired = computed(() => !isSubscriptionActive.value)

    return {
        store,
        printerSettings,
        loading,
        error,
        fetchStore,
        fetchPrinterSettings,
        createStore,
        updateStore,
        isSubscriptionActive,
        subscriptionDaysLeft,
        isSubscriptionExpired
    }
}
