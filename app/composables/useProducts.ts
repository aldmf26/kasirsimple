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
        if (!store.value) return []

        loading.value = true
        error.value = null

        try {
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

            if (fetchError) throw fetchError

            products.value = data || []
            return data
        } catch (e: any) {
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
            const { data, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', store.value.id)
                .eq('is_active', true)
                .eq('has_stock', true)
                .lte('stock', supabase.rpc ? 0 : 5) // Fallback

            if (fetchError) throw fetchError

            // Filter products where stock <= min_stock
            return (data || []).filter(p => p.stock <= p.min_stock)
        } catch (e: any) {
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
            return data
        } catch (e: any) {
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
            return data
        } catch (e: any) {
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
            const { error: deleteError } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', productId)

            if (deleteError) throw deleteError

            products.value = products.value.filter(p => p.id !== productId)
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Update stock
    const updateStock = async (productId: string, quantity: number, type: 'in' | 'out' | 'adjustment', notes?: string) => {
        if (!store.value) throw new Error('Store not found')

        loading.value = true
        error.value = null

        try {
            // Get current product
            const product = products.value.find(p => p.id === productId)
            if (!product) throw new Error('Product not found')

            const stockBefore = product.stock
            let stockAfter = stockBefore

            switch (type) {
                case 'in':
                    stockAfter = stockBefore + quantity
                    break
                case 'out':
                    stockAfter = stockBefore - quantity
                    break
                case 'adjustment':
                    stockAfter = quantity
                    break
            }

            // Update product stock
            await supabase
                .from('products')
                .update({ stock: stockAfter, updated_at: new Date().toISOString() })
                .eq('id', productId)

            // Log stock movement
            await supabase
                .from('stock_movements')
                .insert({
                    product_id: productId,
                    type,
                    quantity: type === 'adjustment' ? quantity - stockBefore : quantity,
                    stock_before: stockBefore,
                    stock_after: stockAfter,
                    notes
                })

            // Update local state
            const index = products.value.findIndex(p => p.id === productId)
            if (index !== -1) {
                products.value[index] = { ...products.value[index], stock: stockAfter }
            }

            return stockAfter
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
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
