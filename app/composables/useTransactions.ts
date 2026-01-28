import type { Database } from '~/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
type TransactionItemInsert = Database['public']['Tables']['transaction_items']['Insert']

export interface CartItem {
    product_id: string
    product_name: string
    product_sku: string | null
    product_price: number
    product_image: string | null
    quantity: number
    subtotal: number
    has_stock: boolean
    current_stock: number
}

export interface TransactionWithItems extends Transaction {
    items: TransactionItem[]
}

export const useTransactions = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const { store } = useStore()
    const { updateStock } = useProducts()

    const transactions = useState<TransactionWithItems[]>('transactions', () => [])
    const cart = useState<CartItem[]>('cart', () => [])
    const loading = useState('transactions_loading', () => false)
    const error = useState<string | null>('transactions_error', () => null)

    // Cart operations
    const addToCart = (product: any) => {
        const existingItem = cart.value.find(item => item.product_id === product.id)

        if (existingItem) {
            // Check stock
            if (product.has_stock && existingItem.quantity >= product.stock) {
                throw new Error('Stok tidak mencukupi')
            }
            existingItem.quantity++
            existingItem.subtotal = existingItem.quantity * existingItem.product_price
        } else {
            cart.value.push({
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                product_price: product.price,
                product_image: product.image_url || null,
                quantity: 1,
                subtotal: product.price,
                has_stock: product.has_stock,
                current_stock: product.stock
            })
        }
    }

    const removeFromCart = (productId: string) => {
        cart.value = cart.value.filter(item => item.product_id !== productId)
    }

    const updateCartItemQuantity = (productId: string, quantity: number) => {
        const item = cart.value.find(item => item.product_id === productId)
        if (item) {
            if (quantity <= 0) {
                removeFromCart(productId)
                return
            }

            // Check stock
            if (item.has_stock && quantity > item.current_stock) {
                throw new Error('Stok tidak mencukupi')
            }

            item.quantity = quantity
            item.subtotal = item.quantity * item.product_price
        }
    }

    const clearCart = () => {
        cart.value = []
    }

    const cartSubtotal = computed(() => {
        return cart.value.reduce((sum, item) => sum + item.subtotal, 0)
    })

    const cartItemsCount = computed(() => {
        return cart.value.reduce((sum, item) => sum + item.quantity, 0)
    })

    // Generate transaction number
    const generateTransactionNumber = async (): Promise<string> => {
        if (!store.value) throw new Error('Store not found')

        const today = new Date()
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
        const prefix = `TRX-${dateStr}`

        // Get today's transaction count
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

        // @ts-ignore
        const { count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.value.id)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)

        const sequence = String((count || 0) + 1).padStart(3, '0')
        return `${prefix}-${sequence}`
    }

    // Create transaction
    const createTransaction = async (paymentData: {
        paid: number
        payment_method: string
        discount?: number
        discount_type?: 'nominal' | 'percent'
        customer_name?: string
        customer_phone?: string
        notes?: string
    }) => {
        const { isDummyMode, createDummyTransaction, getDummyStore } = useDummyMode()
        
        if (!store.value && !isDummyMode.value) throw new Error('Store or user not found')
        if (cart.value.length === 0) throw new Error('Cart is empty')

        loading.value = true
        error.value = null

        try {
            const subtotal = cartSubtotal.value
            let discountAmount = 0

            if (paymentData.discount) {
                if (paymentData.discount_type === 'percent') {
                    discountAmount = subtotal * (paymentData.discount / 100)
                } else {
                    discountAmount = paymentData.discount
                }
            }

            const total = subtotal - discountAmount
            const change = paymentData.paid - total

            if (change < 0) throw new Error('Pembayaran kurang')

            // Handle dummy mode
            if (isDummyMode.value) {
                const dummyStore = getDummyStore()
                const items = cart.value.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.product_price,
                    subtotal: item.subtotal
                }))

                const dummyTransaction = createDummyTransaction({
                    store_id: dummyStore.id,
                    user_id: 'dummy-user',
                    customer_name: paymentData.customer_name || 'Pelanggan Umum',
                    total_amount: total,
                    discount_amount: discountAmount,
                    discount_type: paymentData.discount_type || 'nominal',
                    paid_amount: paymentData.paid,
                    change_amount: change,
                    payment_method: paymentData.payment_method,
                    items: items as any
                })

                console.log('✅ Dummy Mode: Transaction created', dummyTransaction.id)
                
                // Add to transactions list
                transactions.value.push({
                    ...dummyTransaction,
                    items: items as any
                } as TransactionWithItems)
                
                // Clear cart
                clearCart()
                
                return dummyTransaction
            }

            // Original Supabase logic continues...
            const transactionNumber = await generateTransactionNumber()

            // Insert transaction header
            // @ts-ignore
            const { data: transaction, error: transactionError } = await supabase
                .from('transactions')
                .insert({
                    store_id: store.value.id,
                    transaction_number: transactionNumber,
                    subtotal,
                    discount: discountAmount,
                    discount_type: paymentData.discount_type || 'nominal',
                    total,
                    paid: paymentData.paid,
                    change,
                    payment_method: paymentData.payment_method,
                    customer_name: paymentData.customer_name,
                    customer_phone: paymentData.customer_phone,
                    notes: paymentData.notes,
                    created_by: user.value.id
                })
                .select()
                .single()

            if (transactionError) throw transactionError

            // Insert transaction items
            const items: TransactionItemInsert[] = cart.value.map(item => ({
                transaction_id: transaction.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_sku: item.product_sku,
                product_price: item.product_price,
                quantity: item.quantity,
                subtotal: item.subtotal
            }))

            // @ts-ignore
            const { data: transactionItems, error: itemsError } = await supabase
                .from('transaction_items')
                .insert(items)
                .select()

            if (itemsError) throw itemsError

            // Update stock for products with stock tracking
            for (const item of cart.value) {
                if (item.has_stock) {
                    // @ts-ignore
                    await supabase
                        .from('products')
                        .update({
                            stock: item.current_stock - item.quantity,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.product_id)

                    // Log stock movement
                    // @ts-ignore
                    await supabase
                        .from('stock_movements')
                        .insert({
                            product_id: item.product_id,
                            transaction_id: transaction.id,
                            type: 'out',
                            quantity: -item.quantity,
                            stock_before: item.current_stock,
                            stock_after: item.current_stock - item.quantity,
                            notes: `Penjualan: ${transactionNumber}`,
                            created_by: user.value.id
                        })
                }
            }

            // Clear cart
            clearCart()

            // Add to local transactions
            const fullTransaction: TransactionWithItems = {
                ...transaction,
                items: transactionItems || []
            }
            transactions.value.unshift(fullTransaction)

            return fullTransaction
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Fetch transactions
    const fetchTransactions = async (dateFrom?: string, dateTo?: string) => {
        if (!store.value) return []

        loading.value = true
        error.value = null

        try {
            let query = supabase
                .from('transactions')
                .select(`
          *,
          items:transaction_items(*)
        `)
                .eq('store_id', store.value.id)
                .order('created_at', { ascending: false })
                .limit(100)

            if (dateFrom) {
                query = query.gte('created_at', dateFrom)
            }
            if (dateTo) {
                query = query.lte('created_at', dateTo)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            transactions.value = data || []
            return data
        } catch (e: any) {
            error.value = e.message
            return []
        } finally {
            loading.value = false
        }
    }

    // Get today's summary
    const getTodaySummary = async () => {
        if (!store.value) return null

        try {
            const today = new Date()
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('total, payment_method')
                .eq('store_id', store.value.id)
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay)

            if (fetchError) throw fetchError

            const totalSales = (data || []).reduce((sum, t) => sum + t.total, 0)
            const totalTransactions = (data || []).length
            const cashSales = (data || []).filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.total, 0)
            const nonCashSales = totalSales - cashSales

            return {
                totalSales,
                totalTransactions,
                cashSales,
                nonCashSales,
                averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
            }
        } catch (e: any) {
            error.value = e.message
            return null
        }
    }

    return {
        transactions,
        cart,
        loading,
        error,
        cartSubtotal,
        cartItemsCount,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        createTransaction,
        fetchTransactions,
        getTodaySummary
    }
}
