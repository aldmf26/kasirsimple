import type { Database } from '~/types/database'
import { logToActivity, ACTIVITY_TYPES } from '~/utils/activityLogger'
import {
    calcWeightSubtotal,
    formatWeight,
    getStockQuantity,
    isValidWeight,
    validateWeightStock
} from '~/utils/pricing'
import { localDateKey, localDayStartISO, localDayEndISO, isReturnedTransaction, fetchAllRows } from '~/utils/helpers'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionItem = Database['public']['Tables']['transaction_items']['Row']

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

    // Atomic stock change via DB function (row lock); returns before/after.
    const adjustStock = async (productId: string, delta: number) => {
        // @ts-ignore
        const { data, error: rpcError } = await supabase.rpc('adjust_product_stock', {
            p_product_id: productId,
            p_delta: Math.round(delta)
        })
        if (rpcError) throw rpcError
        const row: any = Array.isArray(data) ? data[0] : data
        return { before: Number(row?.stock_before) || 0, after: Number(row?.stock_after) || 0 }
    }

    // Put sold stock back for every tracked item (return / delete). Returns the
    // names of items whose stock could not be restored so the caller can warn.
    const restoreItemsStock = async (transaction: any, reason: string): Promise<string[]> => {
        const warnings: string[] = []
        for (const item of transaction.items || []) {
            if (!item.product_id) continue
            try {
                // @ts-ignore
                const { data: product, error: fetchError } = await supabase
                    .from('products')
                    .select('has_stock, stock_unit')
                    .eq('id', item.product_id)
                    .single()

                if (fetchError || !product) {
                    console.warn('Could not fetch product for stock restoration:', fetchError)
                    warnings.push(item.product_name)
                    continue
                }
                if (!product.has_stock) continue

                const restoreQty = getStockQuantity(item)
                const { before, after } = await adjustStock(item.product_id, restoreQty)
                // @ts-ignore
                await supabase.from('stock_movements').insert({
                    product_id: item.product_id,
                    type: 'in',
                    quantity: restoreQty,
                    stock_before: before,
                    stock_after: after,
                    stock_unit: product.stock_unit || (item.sale_mode === 'weight' ? 'gram' : 'pcs'),
                    notes: `Stok dikembalikan dari ${reason} ${transaction.transaction_number}`,
                    created_by: user.value?.id
                })
            } catch (e: any) {
                console.error('Stock restoration failed for item:', item.product_id, e.message)
                warnings.push(item.product_name)
            }
        }
        return warnings
    }

    // Offline sale: lower stock in the shared product list and its offline copy,
    // so the cashier sees roughly right numbers until the queue syncs.
    const takeStockLocally = (items: { product_id: string | null, stock_qty: number }[]) => {
        const { products } = useProducts()
        products.value = products.value.map((p: any) => {
            const sold = items
                .filter(i => i.product_id === p.id)
                .reduce((sum, i) => sum + (i.stock_qty || 0), 0)
            return sold && p.has_stock ? { ...p, stock: Math.max(0, (Number(p.stock) || 0) - sold) } : p
        })
        if (store.value?.id) saveOffline(`products_${store.value.id}`, products.value)
    }

    // Create transaction
    const createTransaction = async (paymentData: {
        paid: number
        payment_method: string
        discount?: number
        discount_type?: 'nominal' | 'percent'
        customer_name?: string
        customer_phone?: string
        customer_id?: string | null
        notes?: string
        discount_from_settings?: number
        tax?: number
        tax_percentage?: number | null
        ppn?: number
        ppn_percentage?: number | null
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

            // Re-read stock right before saving, so a stale product list cannot oversell.
            // Weight sales allow several lines for the same product, so aggregate first.
            const requiredStock = new Map<string, number>()
            for (const item of cart.value) {
                if (!item.has_stock || item.product_id.startsWith('quick-')) continue
                requiredStock.set(
                    item.product_id,
                    (requiredStock.get(item.product_id) || 0) + getStockQuantity(item)
                )
            }

            let offline = import.meta.client && !navigator.onLine
            for (const [productId, required] of offline ? [] : requiredStock) {
                const item = cart.value.find(i => i.product_id === productId)
                // @ts-ignore
                const { data: product, error: stockFetchError } = await supabase
                    .from('products')
                    .select('stock, has_stock, stock_unit')
                    .eq('id', productId)
                    .single()

                if (stockFetchError && isNetworkError(stockFetchError)) {
                    offline = true
                    break
                }
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
            }

            const isDebt = paymentData.paid < total
            const debtAmount = isDebt ? Math.max(0, total - paymentData.paid) : 0

            let finalNotes = paymentData.notes || ""
            if (isDebt) {
                const debtTag = `[HUTANG: Rp ${debtAmount.toLocaleString("id-ID")}]`
                finalNotes = finalNotes ? `${finalNotes} | ${debtTag}` : debtTag
            }

            // One sale record for create_sale(); the id is made here so a resend
            // (retry, offline sync) is recognised and never saved twice.
            const saleId = crypto.randomUUID()
            const dateKey = localDateKey()
            const sale: Record<string, any> = {
                id: saleId,
                store_id: store.value.id,
                created_at: new Date().toISOString(),
                subtotal,
                discount: discountAmount,
                discount_type: paymentData.discount_type || 'nominal',
                discount_from_settings: paymentData.discount_from_settings || 0,
                tax: paymentData.tax || 0,
                tax_percentage: paymentData.tax_percentage || null,
                ppn: paymentData.ppn || 0,
                ppn_percentage: paymentData.ppn_percentage || null,
                total,
                paid: paymentData.paid,
                change: isDebt ? 0 : change,
                payment_method: paymentData.payment_method,
                customer_name: paymentData.customer_name || null,
                customer_phone: paymentData.customer_phone || null,
                customer_id: paymentData.customer_id || null,
                notes: finalNotes || null,
                items: cart.value.map(item => {
                    const isQuick = item.product_id.startsWith('quick-')
                    return {
                        product_id: isQuick ? null : item.product_id,
                        product_name: item.product_name,
                        product_sku: item.product_sku,
                        product_price: item.product_price,
                        quantity: item.sale_mode === 'weight' ? 1 : item.quantity,
                        subtotal: item.subtotal,
                        sale_mode: item.sale_mode,
                        weight_grams: item.weight_grams,
                        product_unit: item.product_unit,
                        base_price: item.base_price,
                        // pcs or grams to take off stock; 0 = not tracked
                        stock_qty: item.has_stock && !isQuick ? Math.round(getStockQuantity(item)) : 0
                    }
                })
            }

            let transaction: any = null
            let transactionItems: any[] = []
            if (!offline) {
                // @ts-ignore
                const { data, error: saleError } = await supabase.rpc('create_sale', {
                    p_sale: sale,
                    p_date_key: dateKey
                })
                if (saleError && isNetworkError(saleError)) {
                    offline = true
                } else if (saleError) {
                    throw saleError
                } else {
                    const result = data as any
                    transaction = result.transaction
                    transactionItems = result.items || []
                }
            }

            if (offline) {
                // Final number now so the printed receipt matches what gets synced.
                sale.transaction_number = `TRX-${dateKey.replace(/-/g, '')}-OFF-${saleId.slice(0, 5).toUpperCase()}`
                useSaleQueue().enqueue(sale, dateKey)
                takeStockLocally(sale.items)
                const { items: _items, ...header } = sale
                transaction = { ...header, status: 'completed', offline: true }
                transactionItems = sale.items
            }

            // Clear cart
            clearCart()

            // Add to local transactions
            // create_sale is all-or-nothing, so there are no partial stock failures left.
            const fullTransaction: TransactionWithItems & { stock_warnings: string[], offline?: boolean } = {
                ...transaction,
                items: transactionItems || [],
                stock_warnings: []
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
            const storeId = store.value.id
            const data = await fetchAllRows((from, to) => {
                let query = supabase
                    .from('transactions')
                    .select(`
          *,
          items:transaction_items(*)
        `)
                    .eq('store_id', storeId)
                    .order('created_at', { ascending: false })
                    .order('id', { ascending: false })

                if (filters?.startDate) {
                    query = query.gte('created_at', localDayStartISO(filters.startDate))
                }
                if (filters?.endDate) {
                    query = query.lte('created_at', localDayEndISO(filters.endDate))
                }
                if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
                    query = query.eq('payment_method', filters.paymentMethod)
                }
                return query.range(from, to)
            })

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
            const todayKey = localDateKey()
            const startOfDay = localDayStartISO(todayKey)
            const endOfDay = localDayEndISO(todayKey)

            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('id, total, paid, change, payment_method, notes, status, customer_name, created_at')
                .eq('store_id', store.value.id)
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay)

            if (fetchError) throw fetchError

            const activeTransactions = (data || []).filter((t: any) => !isReturnedTransaction(t))

            let totalSales = 0 // Total nilai faktur (omzet barang)
            let totalDebt = 0 // Sisa hutang/kasbon belum lunas
            let debtCount = 0 // Jumlah transaksi belum lunas

            // Uang riil masuk hari ini: dibayar di kasir + cicilan hutang yang diterima hari ini
            const { receivedBetween } = useDebts()
            const { cash: realCash, nonCash: realNonCash } = await receivedBetween(
                activeTransactions as any[],
                startOfDay,
                endOfDay,
            )

            for (const t of activeTransactions) {
                const total = Number(t.total) || 0
                const paid = t.paid != null ? Number(t.paid) : total

                totalSales += total

                if (paid < total) {
                    totalDebt += Math.max(0, total - paid)
                    debtCount += 1
                }
            }

            const totalReceived = realCash + realNonCash
            const totalTransactions = activeTransactions.length

            return {
                totalSales,
                totalTransactions,
                totalReceived,
                realCash,
                realNonCash,
                cashSales: realCash,
                nonCashSales: realNonCash,
                totalDebt,
                debtCount,
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
            // Numbers are unique per store only, so scope to the current store.
            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    items:transaction_items(*),
                    store:stores(*)
                `)
                .eq('transaction_number', transactionNumber)
            if (store.value?.id) query = query.eq('store_id', store.value.id)
            const { data, error: fetchError } = await query.limit(1).single()

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
            if (isReturnedTransaction(transaction as any)) {
                throw new Error('Transaksi ini sudah diretur')
            }

            const restoreWarnings = await restoreItemsStock(transaction, 'retur transaksi')

            // Update transaction notes to mark as returned
            // We use a prefix [RETUR] in notes as a status indicator
            const newNotes = `[RETUR] ${transaction.notes || ''}`.trim()
            const { error: updateError } = await (supabase as any)
                .from('transactions')
                .update({ status: 'returned', notes: newNotes })
                .eq('id', transactionId)

            if (updateError) throw updateError

            // Update local state
            const index = transactions.value.findIndex(t => t.id === transactionId)
            if (index !== -1) {
                transactions.value[index].notes = newNotes
                ;(transactions.value[index] as any).status = 'returned'
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

            return restoreWarnings
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

            // A returned transaction already put its stock back during the return.
            const restoreWarnings = isReturnedTransaction(transaction as any)
                ? []
                : await restoreItemsStock(transaction, 'penghapusan transaksi')

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
            return restoreWarnings
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
            let trx = transactions.value.find(t => t.id === transactionId)
            if (!trx) {
                const { data: dbTrx, error: findErr } = await (supabase as any)
                    .from('transactions')
                    .select('*')
                    .eq('id', transactionId)
                    .single()
                if (findErr || !dbTrx) throw new Error('Transaksi tidak ditemukan')
                trx = dbTrx
            }

            const total = Number(trx.total) || 0
            const currentPaid = Number(trx.paid) || 0
            const remaining = total - currentPaid
            if (remaining <= 0) throw new Error('Transaksi ini sudah lunas')

            // Pay the whole rest through pay_debts so it lands in the installment
            // history and in today's/shift cash like any other installment.
            const { payDebts } = useDebts()
            await payDebts([transactionId], remaining, 'cash')

            const { data: updated, error: reloadErr } = await (supabase as any)
                .from('transactions')
                .select('paid, change, notes')
                .eq('id', transactionId)
                .single()
            if (reloadErr) throw reloadErr

            const idx = transactions.value.findIndex(t => t.id === transactionId)
            if (idx > -1) {
                transactions.value[idx] = { ...transactions.value[idx], ...updated }
            }
            return { ...trx, ...updated }
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
