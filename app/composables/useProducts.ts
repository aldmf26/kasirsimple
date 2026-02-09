import type { Database } from '~/types/database'
import { logToActivity, ACTIVITY_TYPES } from '~/utils/activityLogger'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductWithCategory extends Product {
    buy_price?: number | null
    unit?: string | null
    is_favorite?: boolean
    category?: {
        id: string
        name: string
        color: string
    } | null
}

export const useProducts = () => {
    const supabase = useSupabaseClient<Database>()
    const { store } = useStore()
    const user = useSupabaseUser()

    const products = useState<ProductWithCategory[]>('products', () => [])
    const loading = useState('products_loading', () => false)
    const error = useState<string | null>('products_error', () => null)

    // Fetch all products for current store
    const fetchProducts = async (categoryId?: string) => {
        if (!store.value) {
            return []
        }

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

            if (fetchError) {
                throw fetchError
            }

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
            return lowStockProducts
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

            // Log activity
            logToActivity(
                store.value.id,
                ACTIVITY_TYPES.PRODUCT_CREATED,
                {
                    productName: data.name,
                    sku: data.sku,
                    price: data.price,
                    buyPrice: data.buy_price,
                    stock: data.stock,
                    category: data.category
                },
                data.id,
                user.value?.id
            )

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
            // Get product before update for logging changes
            const oldProduct = products.value.find(p => p.id === productId)

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

            // Log activity with changes
            const changes: any = {}
            if (oldProduct && oldProduct.name !== data.name) changes.name = { old: oldProduct.name, new: data.name }
            if (oldProduct && oldProduct.price !== data.price) changes.price = { old: oldProduct.price, new: data.price }
            if (oldProduct && oldProduct.buy_price !== data.buy_price) changes.buyPrice = { old: oldProduct.buy_price, new: data.buy_price }
            if (oldProduct && oldProduct.stock !== data.stock) changes.stock = { old: oldProduct.stock, new: data.stock }

            logToActivity(
                store.value?.id || '',
                ACTIVITY_TYPES.PRODUCT_UPDATED,
                {
                    productName: data.name,
                    sku: data.sku,
                    changes
                },
                productId,
                user.value?.id
            )

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

    const deleteProduct = async (id: string) => {
        if (!store.value) return

        loading.value = true
        error.value = null

        try {
            // Get product before delete for logging
            const product = products.value.find(p => p.id === id)

            // @ts-ignore
            const { error: deleteError } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', id)
                .eq('store_id', store.value.id)

            if (deleteError) throw deleteError

            // Remove from local state
            products.value = products.value.filter(p => p.id !== id)

            // Log activity
            logToActivity(
                store.value.id,
                ACTIVITY_TYPES.PRODUCT_DELETED,
                {
                    productName: product?.name,
                    sku: product?.sku,
                    price: product?.price
                },
                id,
                user.value?.id
            )
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Update Stock
    const updateStock = async (productId: string, type: 'in' | 'out' | 'adjustment', quantity: number, notes?: string) => {
        if (!store.value) return

        loading.value = true
        try {
            const product = products.value.find(p => p.id === productId)
            if (!product) throw new Error('Produk tidak ditemukan')

            const currentStock = product.stock || 0
            let newStock = currentStock
            let movementType = type
            let activityType = ACTIVITY_TYPES.STOCK_ADJUSTMENT

            if (type === 'in') {
                newStock += quantity
                activityType = ACTIVITY_TYPES.STOCK_IN
            } else if (type === 'out') {
                newStock -= quantity
                activityType = ACTIVITY_TYPES.STOCK_OUT
            } else if (type === 'adjustment') {
                newStock = quantity
                if (newStock > currentStock) movementType = 'in'
                else if (newStock < currentStock) movementType = 'out'
                else movementType = 'adjustment'
            }

            if (newStock < 0) throw new Error('Stok tidak boleh kurang dari 0')

            // Update Product
            // @ts-ignore
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId)

            if (updateError) throw updateError

            // Record Movement
            // @ts-ignore
            await supabase.from('stock_movements').insert({
                product_id: productId,
                type: type === 'adjustment' ? 'adjustment' : movementType,
                quantity: type === 'adjustment' ? Math.abs(newStock - currentStock) : quantity,
                stock_before: currentStock,
                stock_after: newStock,
                notes: notes,
            })

            // Log activity
            logToActivity(
                store.value.id,
                activityType,
                {
                    productName: product.name,
                    productId,
                    stockBefore: currentStock,
                    stockAfter: newStock,
                    quantity: type === 'adjustment' ? Math.abs(newStock - currentStock) : quantity,
                    notes
                },
                productId,
                user.value?.id
            )

            // Update Local
            product.stock = newStock

        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Toggle favorite
    const toggleFavorite = async (productId: string) => {
        try {
            const product = products.value.find(p => p.id === productId)
            if (!product) throw new Error('Product not found')

            const newFavoriteStatus = !product.is_favorite

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    is_favorite: newFavoriteStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId)

            if (updateError) throw updateError

            // Update local state
            const productIndex = products.value.findIndex(p => p.id === productId)
            if (productIndex !== -1) {
                products.value[productIndex].is_favorite = newFavoriteStatus
            }

            console.log('✅ Favorite status updated:', newFavoriteStatus)
            return newFavoriteStatus
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
        updateStock,
        toggleFavorite
    }
}
