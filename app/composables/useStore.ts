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

    // Fetch current user's store
    const fetchStore = async () => {
        // Use dummy data if dummy mode is enabled
        if (isDummyMode.value) {
            loading.value = true
            try {
                const dummyStore = getDummyStore()
                store.value = dummyStore as unknown as Store
                console.log('📦 Dummy Mode: Loaded store', dummyStore.name)
                return dummyStore
            } finally {
                loading.value = false
            }
        }

        if (!user.value?.id) {
            console.warn('⏳ No authenticated user yet, skipping store fetch');
            store.value = null;
            return null;
        }

        loading.value = true;
        error.value = null;

        try {
            console.log('📦 Fetching store for user:', user.value.sub);

            const { data, error: fetchError } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', user.value.sub)
                .eq('is_active', true)
                .maybeSingle();  // <-- ganti single() jadi maybeSingle() biar tidak error kalau 0 row

            if (fetchError) throw fetchError;

            store.value = data;
            return data;
        } catch (e: any) {
            console.error('❌ Error fetching store:', e);
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
            const { data, error: createError } = await supabase
                .from('stores')
                .insert({
                    ...storeData,
                    user_id: user.value.sub
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
