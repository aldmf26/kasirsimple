import type { Database } from '~/types/database'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductWithCategory extends Product {
    category?: {
        id: string
        name: string
        color: string
    } | null
}

export const useProducts = () => {
    const supabase = useSupabaseClient<Database>()
    const { store } = useStore()

    const products = useState<ProductWithCategory[]>('products', () => [])
    const loading = useState('products_loading', () => false)
    const error = useState<string | null>('products_error', () => null)

    // Fetch all products for current store
    const fetchProducts = async (categoryId?: string) => {
        if (!store.value) {
            console.warn('⏳ Store not loaded yet')
            return []
        }

        loading.value = true
        error.value = null

        try {
            console.log('📦 Fetching products for store:', store.value.id)

            let query = supabase
                .from('products')
                .select(`
          *,
          category:categories(id, name, color)
        `)
                .eq('store_id', store.value.id)
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (categoryId) {
                query = query.eq('category_id', categoryId)
            }

            const { data, error: fetchError } = await query

            if (fetchError) {
                console.error('❌ Error fetching products:', fetchError)
                throw fetchError
            }

            products.value = data || []
            console.log('✅ Loaded', data?.length, 'products')
            return data
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    // Search products
    const searchProducts = async (searchTerm: string) => {
        if (!store.value) return []

        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('products')
                .select(`
          *,
          category:categories(id, name, color)
        `)
                .eq('store_id', store.value.id)
                .eq('is_active', true)
                .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
                .order('name', { ascending: true })

            if (fetchError) throw fetchError

            return data || []
        } catch (e: any) {
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    // Get low stock products
    const getLowStockProducts = async () => {
        if (!store.value) return []

        try {
            console.log('📦 Fetching low stock products for store:', store.value.id)
            
            const { data, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', store.value.id)
                .eq('is_active', true)
                .eq('has_stock', true)

            if (fetchError) throw fetchError

            // Filter products where stock <= min_stock
            const lowStockProducts = (data || []).filter(p => p.stock <= (p.min_stock || 5))
            console.log('✅ Found', lowStockProducts.length, 'low stock products')
            return lowStockProducts
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            return []
        }
    }

    // Create a new product
    const createProduct = async (productData: Omit<ProductInsert, 'store_id'>) => {
        if (!store.value) throw new Error('Store not found')

        loading.value = true
        error.value = null

        try {
            console.log('📝 Creating product:', productData.name)

            const { data, error: createError } = await supabase
                .from('products')
                .insert({
                    ...productData,
                    store_id: store.value.id
                })
                .select(`
          *,
          category:categories(id, name, color)
        `)
                .single()

            if (createError) throw createError

            products.value.push(data)
            console.log('✅ Product created:', data.name)
            return data
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Update product
    const updateProduct = async (productId: string, productData: ProductUpdate) => {
        loading.value = true
        error.value = null

        try {
            console.log('✏️ Updating product:', productId)

            const { data, error: updateError } = await supabase
                .from('products')
                .update({
                    ...productData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId)
                .select(`
          *,
          category:categories(id, name, color)
        `)
                .single()

            if (updateError) throw updateError

            const index = products.value.findIndex(p => p.id === productId)
            if (index !== -1) {
                products.value[index] = data
            }
            console.log('✅ Product updated')
            return data
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Delete product (soft delete)
    const deleteProduct = async (productId: string) => {
        loading.value = true
        error.value = null

        try {
            console.log('🗑️ Deleting product:', productId)

            const { error: deleteError } = await supabase
                .from('products')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', productId)

            if (deleteError) throw deleteError

            products.value = products.value.filter(p => p.id !== productId)
            console.log('✅ Product deleted')
        } catch (e: any) {
            console.error('❌ Error:', e)
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Update stock
    const updateStock = async (productId: string, quantity: number, notes?: string) => {
        try {
            console.log('📦 Updating stock for product:', productId, 'quantity:', quantity)

            const product = products.value.find(p => p.id === productId)
            if (!product) throw new Error('Product not found')

            const newStock = (product.stock || 0) + quantity
            if (newStock < 0) throw new Error('Stock tidak boleh negatif')

            // Update product stock
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    stock: newStock,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId)

            if (updateError) throw updateError

            // Log stock movement
            const { error: logError } = await supabase
                .from('stock_movements')
                .insert({
                    product_id: productId,
                    type: quantity > 0 ? 'in' : 'out',
                    quantity: Math.abs(quantity),
                    stock_before: product.stock || 0,
                    stock_after: newStock,
                    notes: notes || null
                })

            if (logError) console.error('⚠️ Warning: Could not log stock movement:', logError)

            // Update local state
            const productIndex = products.value.findIndex(p => p.id === productId)
            if (productIndex !== -1) {
                products.value[productIndex].stock = newStock
            }

            console.log('✅ Stock updated. Old:', product.stock || 0, 'New:', newStock)
        } catch (e: any) {
            console.error('❌ Error:', e)
            throw e
        }
    }

    return {
        products,
        loading,
        error,
        fetchProducts,
        searchProducts,
        getLowStockProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        updateStock
    }
}
