import type { Database } from '~/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export const useCategories = () => {
    const supabase = useSupabaseClient<Database>()
    const { store } = useStore()

    const categories = useState<Category[]>('categories', () => [])
    const loading = useState('categories_loading', () => false)
    const error = useState<string | null>('categories_error', () => null)

    // Fetch all categories for current store
    const fetchCategories = async () => {
        if (!store.value) {
            console.warn('⏳ Store is null, cannot fetch categories')
            return []
        }

        loading.value = true
        error.value = null

        try {
            console.log('📦 Fetching categories for store:', store.value.id)
            
            const { data, error: fetchError } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', store.value.id)
                .eq('is_active', true)
                .order('sort_order', { ascending: true })

            if (fetchError) {
                console.error('❌ Error:', fetchError)
                throw fetchError
            }

            categories.value = data || []
            console.log('✅ Loaded', data?.length, 'categories')
            return data
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    // Create a new category
    const createCategory = async (categoryData: Omit<CategoryInsert, 'store_id'>) => {
        if (!store.value) throw new Error('Store not found')

        loading.value = true
        error.value = null

        try {
            console.log('📝 Creating category:', categoryData.name)

            const { data, error: createError } = await supabase
                .from('categories')
                .insert({
                    ...categoryData,
                    store_id: store.value.id
                })
                .select()
                .single()

            if (createError) throw createError

            categories.value.push(data)
            console.log('✅ Category created')
            return data
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Update category
    const updateCategory = async (categoryId: string, categoryData: CategoryUpdate) => {
        loading.value = true
        error.value = null

        try {
            console.log('✏️ Updating category:', categoryId)

            const { data, error: updateError } = await supabase
                .from('categories')
                .update({
                    ...categoryData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', categoryId)
                .select()
                .single()

            if (updateError) throw updateError

            const index = categories.value.findIndex(c => c.id === categoryId)
            if (index !== -1) {
                categories.value[index] = data
            }
            console.log('✅ Category updated')
            return data
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Delete category (soft delete)
    const deleteCategory = async (categoryId: string) => {
        loading.value = true
        error.value = null

        try {
            console.log('🗑️ Deleting category:', categoryId)

            const { error: deleteError } = await supabase
                .from('categories')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', categoryId)

            if (deleteError) throw deleteError

            categories.value = categories.value.filter(c => c.id !== categoryId)
            console.log('✅ Category deleted')
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory
    }
}
