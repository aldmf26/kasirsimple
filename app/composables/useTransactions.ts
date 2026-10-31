import type { Database } from '~/types/database'
import { logToActivity, ACTIVITY_TYPES } from '~/utils/activityLogger'
import {
    calcWeightSubtotal,
    formatWeight,
    getStockQuantity,
    isValidWeight,
    validateWeightStock
} from '~/utils/pricing'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
type TransactionItemInsert = Database['public']['Tables']['transaction_items']['Insert']

export interface CartItem {
    cart_line_id: string
    product_id: string
    product_name: string
    product_sku: string | null
    product_price: number
    product_image: string | null
    quantity: number
    subtotal: number
    has_stock: boolean
    current_stock: number
    sale_mode: 'unit' | 'weight'
    weight_grams: number | null
    product_unit: string | null
    base_price: number
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
        const isQuickSale = product.is_quick_sale === true || !product.id
        const isWeight = product.sale_mode === 'weight'
        const lineId = product.cart_line_id || (isWeight
            ? `weight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            : (product.id || `quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`))

        if (isWeight) {
            const grams = Number(product.weight_grams ?? product.quantity)
            const pricePerKg = Number(product.price)

            if (!isValidWeight(grams)) {
                throw new Error('Berat harus lebih dari 0 gram')
            }
            if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
                throw new Error('Harga per kg tidak valid')
            }
            if (product.has_stock) {
                const stockError = validateWeightStock(grams, Number(product.stock) || 0)
                if (stockError) throw new Error(stockError)
            }

            // Every weighing is its own line: never merge weight items.
            cart.value.push({
                cart_line_id: lineId,
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku || null,
                product_price: pricePerKg,
                product_image: product.image_url || null,
                quantity: 1,
                subtotal: calcWeightSubtotal(grams, pricePerKg),
                has_stock: product.has_stock === true,
                current_stock: Number(product.stock) || 0,
                sale_mode: 'weight',
                weight_grams: Math.round(grams),
                product_unit: product.unit || 'kg',
                base_price: Number(product.price) || 0
            })
            return
        }

        const existingItem = isQuickSale
            ? null
            : cart.value.find(item => item.product_id === product.id && item.sale_mode !== 'weight')

        if (existingItem) {
            // Check stock
            if (product.has_stock && existingItem.quantity >= product.stock) {
                throw new Error('Stok tidak mencukupi')
            }
            existingItem.quantity++
            existingItem.subtotal = existingItem.quantity * existingItem.product_price
        } else {
            cart.value.push({
                cart_line_id: lineId,
                product_id: lineId,
                product_name: product.name,
                product_sku: product.sku || null,
                product_price: product.price,
                product_image: product.image_url || null,
                quantity: product.quantity || 1,
                subtotal: product.price * (product.quantity || 1),
                has_stock: product.has_stock === true,
                current_stock: product.stock || 0,
                sale_mode: 'unit',
                weight_grams: null,
                product_unit: product.unit || 'pcs',
                base_price: Number(product.price) || 0
            })
        }
    }

    const findCartLine = (lineId: string) =>
        cart.value.find(item => item.cart_line_id === lineId)

    const removeFromCart = (lineId: string) => {
        // Only the exact line goes: two weighings of the same product are separate lines.
        cart.value = cart.value.filter(item => item.cart_line_id !== lineId)
    }

    const updateCartItemQuantity = (lineId: string, quantity: number) => {
        const item = findCartLine(lineId)
        if (item) {
            if (item.sale_mode === 'weight') return

            if (quantity <= 0) {
                removeFromCart(lineId)
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

    const updateCartItemWeight = (lineId: string, grams: number, pricePerKg?: number) => {
        const item = findCartLine(lineId)
        if (!item || item.sale_mode !== 'weight') return

        const nextGrams = Math.round(Number(grams))
        if (!isValidWeight(nextGrams)) {
            throw new Error('Berat harus lebih dari 0 gram')
        }
        if (item.has_stock && nextGrams > item.current_stock) {
            throw new Error(`Stok tidak cukup (tersisa ${formatWeight(item.current_stock)})`)
        }

        const price = pricePerKg === undefined ? item.product_price : Number(pricePerKg)
        if (!Number.isFinite(price) || price < 0) {
            throw new Error('Harga per kg tidak valid')
        }

        item.weight_grams = nextGrams
        item.product_price = price
        item.quantity = 1
        item.subtotal = calcWeightSubtotal(nextGrams, price)
    }

    const updateCartItemPrice = (lineId: string, price: number) => {
        const item = findCartLine(lineId)
        if (!item) return

        const nextPrice = Number(price)
        if (!Number.isFinite(nextPrice) || nextPrice < 0) {
            throw new Error('Harga tidak valid')
        }

        item.product_price = nextPrice
        item.subtotal = item.sale_mode === 'weight'
            ? calcWeightSubtotal(Number(item.weight_grams), nextPrice)
            : item.quantity * nextPrice
    }

    const clearCart = () => {
        cart.value = []
    }

    const cartSubtotal = computed(() => {
        return cart.value.reduce((sum, item) => sum + item.subtotal, 0)
    })

    const cartItemsCount = computed(() => {
        // A weight line is one item regardless of grams.
        return cart.value.reduce((sum, item) => sum + (item.sale_mode === 'weight' ? 1 : item.quantity), 0)
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

        try {
            // @ts-ignore
            const { count } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', store.value.id)
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay)

            const sequence = String((count || 0) + 1).padStart(3, '0')
            return `${prefix}-${sequence}`
        } catch (e: any) {
            console.warn('⚠️ Using fallback transaction number:', e.message)
            const timestamp = Date.now().toString().slice(-6)
            return `${prefix}-${timestamp}`
        }
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
        if (!store.value) throw new Error('Store not found')
        if (!user.value) throw new Error('User pengguna tidak ditemukan (Login diperlukan)') // Tambahkan auth check
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

            // Calculate total including discount from settings, tax, and ppn
            const discountFromSettings = paymentData.discount_from_settings || 0
            const tax = paymentData.tax || 0
            const ppn = paymentData.ppn || 0

            const subtotalAfterDiscount = subtotal - discountAmount - discountFromSettings
            const total = subtotalAfterDiscount + tax + ppn
            const change = paymentData.paid - total

            if (paymentData.payment_method === 'cash' && change < 0) {
                throw new Error('Pembayaran kurang')
            }

            // Re-read stock right before saving, so a stale product list cannot oversell.
            // Weight sales allow several lines for the same product, so aggregate first.
            const stockSnapshot = new Map<string, { stock: number; stock_unit: string }>()
            const requiredStock = new Map<string, number>()
            for (const item of cart.value) {
                if (!item.has_stock || item.product_id.startsWith('quick-')) continue
                requiredStock.set(
                    item.product_id,
                    (requiredStock.get(item.product_id) || 0) + getStockQuantity(item)
                )
            }

            for (const [productId, required] of requiredStock) {
                const item = cart.value.find(i => i.product_id === productId)
                // @ts-ignore
                const { data: product, error: stockFetchError } = await supabase
                    .from('products')
                    .select('stock, has_stock, stock_unit')
                    .eq('id', productId)
                    .single()

                if (stockFetchError || !product) {
                    throw new Error(`Gagal memeriksa stok ${item?.product_name || 'produk'}`)
                }

                const available = Number(product.stock) || 0
                if (product.has_stock && required > available) {
                    const left = product.stock_unit === 'gram'
                        ? formatWeight(available)
                        : `${available} ${item?.product_unit || 'pcs'}`
                    throw new Error(`Stok ${item?.product_name || 'produk'} tidak cukup (tersisa ${left})`)
                }

                stockSnapshot.set(productId, {
                    stock: available,
                    stock_unit: product.stock_unit || 'pcs'
                })
            }

            const transactionNumber = await generateTransactionNumber()

            const isDebt = paymentData.paid < total
            const debtAmount = isDebt ? Math.max(0, total - paymentData.paid) : 0

            let finalNotes = paymentData.notes || ""
            if (isDebt) {
                const debtTag = `[HUTANG: Rp ${debtAmount.toLocaleString("id-ID")}]`
                finalNotes = finalNotes ? `${finalNotes} | ${debtTag}` : debtTag
            }

            // Build insert object dengan optional fields
            const transactionInsert: any = {
                store_id: store.value.id,
                transaction_number: transactionNumber,
                subtotal,
                discount: discountAmount,
                discount_type: paymentData.discount_type || 'nominal',
                total,
                paid: paymentData.paid,
                change: isDebt ? 0 : change,
                payment_method: paymentData.payment_method,
                customer_name: paymentData.customer_name || null,
                customer_phone: paymentData.customer_phone || null,
                notes: finalNotes || null,
                created_by: user.value?.id
            }

            // Add optional discount & tax fields jika ada
            if (paymentData.discount_from_settings !== undefined) {
                transactionInsert.discount_from_settings = paymentData.discount_from_settings || 0
            }
            if (paymentData.tax !== undefined) {
                transactionInsert.tax = paymentData.tax || 0
            }
            if (paymentData.tax_percentage !== undefined) {
                transactionInsert.tax_percentage = paymentData.tax_percentage || null
            }
            if (paymentData.ppn !== undefined) {
                transactionInsert.ppn = paymentData.ppn || 0
            }
            if (paymentData.ppn_percentage !== undefined) {
                transactionInsert.ppn_percentage = paymentData.ppn_percentage || null
            }

            // Insert transaction header
            // @ts-ignore
            const { data: transaction, error: transactionError } = await supabase
                .from('transactions')
                .insert(transactionInsert)
                .select()
                .single()

            if (transactionError) {
                throw transactionError
            }

            // Insert transaction items
            const items: TransactionItemInsert[] = cart.value.map(item => ({
                transaction_id: transaction.id,
                // store_id dihapus karena tidak ada di schema
                product_id: item.product_id.startsWith('quick-') ? null : item.product_id,
                product_name: item.product_name,
                product_sku: item.product_sku,
                product_price: item.product_price,
                quantity: item.sale_mode === 'weight' ? 1 : item.quantity,
                subtotal: item.subtotal,
                sale_mode: item.sale_mode,
                weight_grams: item.weight_grams,
                product_unit: item.product_unit,
                base_price: item.base_price
            }))

            // @ts-ignore
            const { data: transactionItems, error: itemsError } = await supabase
                .from('transaction_items')
                .insert(items)
                .select()

            if (itemsError) {
                throw itemsError
            }

            // Update stock for products with stock tracking
            const remainingStock = new Map<string, number>()
            for (const item of cart.value) {
                if (item.has_stock && !item.product_id.startsWith('quick-')) {
                    try {
                        const snapshot = stockSnapshot.get(item.product_id)
                        const beforeStock = remainingStock.get(item.product_id)
                            ?? snapshot?.stock
                            ?? item.current_stock
                        const delta = getStockQuantity(item)
                        const newStock = Math.max(0, beforeStock - delta)
                        const stockUnit = snapshot?.stock_unit || (item.sale_mode === 'weight' ? 'gram' : 'pcs')
                        remainingStock.set(item.product_id, newStock)

                        // Update product stock
                        // @ts-ignore
                        const { error: stockError } = await supabase
                            .from('products')
                            .update({
                                stock: newStock,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', item.product_id)

                        if (stockError) throw stockError

                        // Log stock movement
                        // @ts-ignore
                        await supabase
                            .from('stock_movements')
                            .insert({
                                product_id: item.product_id,
                                transaction_id: transaction.id,
                                type: 'out',
                                quantity: delta,
                                stock_before: beforeStock,
                                stock_after: newStock,
                                stock_unit: stockUnit,
                                notes: `Penjualan: ${transactionNumber}`,
                                created_by: user.value?.id
                            })
                    } catch (e: any) {
                        console.warn('Stock update failed:', e.message)
                    }
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

            // Log activity
            logToActivity(
                store.value.id,
                ACTIVITY_TYPES.TRANSACTION_CREATED,
                {
                    transactionNumber: transaction.transaction_number,
                    totalAmount: transaction.total,
                    itemCount: transactionItems?.length || 0,
                    paymentMethod: transaction.payment_method,
                    customerName: transaction.customer_name,
                    discountAmount: transaction.discount
                },
                transaction.id,
                user.value?.id
            )

            return fullTransaction
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Fetch transactions
    const fetchTransactions = async (filters?: { startDate?: string, endDate?: string, paymentMethod?: string }) => {
        if (!store.value) return

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

            // Apply Filters
            if (filters?.startDate) {
                query = query.gte('created_at', `${filters.startDate}T00:00:00`)
            }
            if (filters?.endDate) {
                query = query.lte('created_at', `${filters.endDate}T23:59:59`)
            }
            if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
                query = query.eq('payment_method', filters.paymentMethod) // asumsikan value di db 'cash'/'transfer'
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

    // Get single transaction by order number (Public check)
    const getTransactionByNumber = async (transactionNumber: string) => {
        loading.value = true
        error.value = null
        try {
            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select(`
                    *,
                    items:transaction_items(*),
                    store:stores(*)
                `)
                .eq('transaction_number', transactionNumber)
                .single()

            if (fetchError) throw fetchError
            return data
        } catch (e: any) {
            error.value = e.message
            return null
        } finally {
            loading.value = false
        }
    }

    // Return transaction (Restore stock and mark as returned)
    const returnTransaction = async (transactionId: string) => {
        loading.value = true
        try {
            // Get transaction data first
            const transaction = transactions.value.find(t => t.id === transactionId)
            if (!transaction) throw new Error('Transaksi tidak ditemukan')
            if (transaction.notes?.startsWith('[RETUR]')) {
                throw new Error('Transaksi ini sudah diretur')
            }

            // Restore stock for each item
            if (transaction.items && transaction.items.length > 0) {
                for (const item of transaction.items) {
                    if (!item.product_id) continue
                    try {
                        // Get current stock
                        // @ts-ignore
                        const { data: product, error: fetchError } = await supabase
                            .from('products')
                            .select('stock, has_stock, stock_unit')
                            .eq('id', item.product_id)
                            .single()

                        if (fetchError || !product) {
                            console.warn('Could not fetch product for stock restoration:', fetchError)
                            continue
                        }

                        // Only restore stock if product tracks stock
                        if (product.has_stock) {
                            const currentStock = product.stock || 0
                            const restoreQty = getStockQuantity(item)
                            const newStock = currentStock + restoreQty

                            // @ts-ignore
                            const { error: stockError } = await supabase
                                .from('products')
                                .update({
                                    stock: newStock,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', item.product_id)

                            if (stockError) throw stockError

                            // Record stock movement as reversal
                            // @ts-ignore
                            await supabase.from('stock_movements').insert({
                                product_id: item.product_id,
                                type: 'in',
                                quantity: restoreQty,
                                stock_before: currentStock,
                                stock_after: newStock,
                                stock_unit: product.stock_unit || (item.sale_mode === 'weight' ? 'gram' : 'pcs'),
                                notes: `Stok dikembalikan dari retur transaksi ${transaction.transaction_number}`,
                                created_by: user.value?.id
                            })
                        }
                    } catch (e: any) {
                        console.error('Stock restoration failed for item:', item.product_id, e.message)
                    }
                }
            }

            // Update transaction notes to mark as returned
            // We use a prefix [RETUR] in notes as a status indicator
            const newNotes = `[RETUR] ${transaction.notes || ''}`.trim()
            // @ts-ignore
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ notes: newNotes })
                .eq('id', transactionId)

            if (updateError) throw updateError

            // Update local state
            const index = transactions.value.findIndex(t => t.id === transactionId)
            if (index !== -1) {
                transactions.value[index].notes = newNotes
            }

            // Log activity
            logToActivity(
                store.value?.id || '',
                ACTIVITY_TYPES.TRANSACTION_DELETED, // Reusing delete type for now or add new if exist
                {
                    transactionNumber: transaction.transaction_number,
                    notes: 'Transaksi di-retur'
                },
                transactionId,
                user.value?.id
            )

        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    // Delete transaction
    const deleteTransaction = async (transactionId: string) => {
        loading.value = true
        try {
            const { logActivity } = useActivityLog()

            // Get transaction data first
            const transaction = transactions.value.find(t => t.id === transactionId)
            if (!transaction) throw new Error('Transaksi tidak ditemukan')

            // Restore stock for each item
            if (transaction.items && transaction.items.length > 0) {
                for (const item of transaction.items) {
                    if (!item.product_id) continue
                    try {
                        // Get current stock
                        // @ts-ignore
                        const { data: product, error: fetchError } = await supabase
                            .from('products')
                            .select('stock, has_stock, stock_unit')
                            .eq('id', item.product_id)
                            .single()

                        if (fetchError || !product) {
                            console.warn('Could not fetch product for stock restoration:', fetchError)
                            continue
                        }

                        // Only restore stock if product tracks stock
                        if (product.has_stock) {
                            const currentStock = product.stock || 0
                            const restoreQty = getStockQuantity(item)
                            const newStock = currentStock + restoreQty

                            // @ts-ignore
                            const { error: stockError } = await supabase
                                .from('products')
                                .update({
                                    stock: newStock,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', item.product_id)

                            if (stockError) throw stockError

                            // Record stock movement as reversal
                            // @ts-ignore
                            await supabase.from('stock_movements').insert({
                                product_id: item.product_id,
                                type: 'in',
                                quantity: restoreQty,
                                stock_before: currentStock,
                                stock_after: newStock,
                                stock_unit: product.stock_unit || (item.sale_mode === 'weight' ? 'gram' : 'pcs'),
                                notes: `Stok dikembalikan dari penghapusan transaksi ${transaction.transaction_number}`,
                                created_by: user.value?.id
                            })
                        }
                    } catch (e: any) {
                        console.error('Stock restoration failed for item:', item.product_id, e.message)
                    }
                }
            }

            // Delete transaction header (items will be deleted automatically via ON DELETE CASCADE)
            // @ts-ignore
            const { error: delError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId)

            if (delError) throw delError

            // Log activity to localStorage
            const userId = user.value?.id
            if (store.value?.id) {
                logToActivity(
                    store.value.id,
                    ACTIVITY_TYPES.TRANSACTION_DELETED,
                    {
                        transactionNumber: transaction.transaction_number,
                        totalAmount: transaction.total,
                        itemCount: transaction.items?.length || 0,
                        paymentMethod: transaction.payment_method
                    },
                    transactionId,
                    userId
                )
            }

            transactions.value = transactions.value.filter(t => t.id !== transactionId)
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    const settleDebtTransaction = async (transactionId: string) => {
        if (!store.value) throw new Error('Store not found')
        loading.value = true
        error.value = null

        try {
            const trx = transactions.value.find(t => t.id === transactionId)
            if (!trx) throw new Error('Transaksi tidak ditemukan')

            const total = Number(trx.total) || 0
            const currentPaid = Number(trx.paid) || 0
            const remaining = total - currentPaid
            if (remaining <= 0) throw new Error('Transaksi ini sudah lunas')

            const now = new Date()
            const timeStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            
            // Bersihkan tag [HUTANG: ...] jika ada dan ganti dengan [LUNAS ...]
            let updatedNotes = trx.notes || ""
            if (updatedNotes.includes('[HUTANG')) {
                updatedNotes = updatedNotes.replace(/\[HUTANG:[^\]]*\]/g, `[LUNAS ${timeStr}]`).trim()
            } else {
                updatedNotes = updatedNotes ? `${updatedNotes} | [LUNAS ${timeStr}]` : `[LUNAS ${timeStr}]`
            }

            // Update in Supabase
            // @ts-ignore
            const { data, error: updateErr } = await supabase
                .from('transactions')
                .update({
                    paid: total,
                    change: 0,
                    notes: updatedNotes,
                })
                .eq('id', transactionId)
                .select()
                .single()

            if (updateErr) throw updateErr

            // Update local state
            const idx = transactions.value.findIndex(t => t.id === transactionId)
            if (idx > -1) {
                transactions.value[idx] = {
                    ...transactions.value[idx],
                    paid: total,
                    change: 0,
                    notes: updatedNotes
                }
            }

            return transactions.value[idx]
        } catch (e: any) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
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
        updateCartItemWeight,
        updateCartItemPrice,
        clearCart,
        createTransaction,
        fetchTransactions,
        getTodaySummary,
        deleteTransaction,
        getTransactionByNumber,
        returnTransaction,
        settleDebtTransaction
    }
}
