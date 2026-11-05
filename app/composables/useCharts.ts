export const useCharts = () => {
    // Calculate sales by payment method for pie chart
    const getSalesByPaymentMethod = (transactions: any[]) => {
        if (transactions.length === 0) return { methods: [], amounts: [] }

        const salesByMethod: Record<string, number> = {}
        
        transactions.forEach(t => {
            const method = t.payment_method === 'cash' ? 'Tunai' : 'Transfer'
            if (!salesByMethod[method]) {
                salesByMethod[method] = 0
            }
            salesByMethod[method] += t.total
        })

        return {
            methods: Object.keys(salesByMethod),
            amounts: Object.values(salesByMethod)
        }
    }

    // Get top selling products
    const getTopSellingProducts = (transactions: any[], limit = 5) => {
        if (transactions.length === 0) return { products: [], quantities: [], weightGrams: [], sales: [] }

        const productStats: Record<string, { quantity: number; weightGrams: number; sales: number }> = {}

        transactions.forEach(t => {
            t.items?.forEach((item: any) => {
                if (!productStats[item.product_name]) {
                    productStats[item.product_name] = { quantity: 0, weightGrams: 0, sales: 0 }
                }
                const stat = productStats[item.product_name]
                if (stat) {
                    if (item.sale_mode === 'weight') {
                        stat.weightGrams += Number(item.weight_grams) || 0
                    } else {
                        stat.quantity += Number(item.quantity) || 0
                    }
                    stat.sales += Number(item.subtotal) || 0
                }
            })
        })

        // Rank by revenue so unit and weight products can be compared fairly
        const sorted = Object.entries(productStats)
            .sort((a, b) => b[1].sales - a[1].sales)
            .slice(0, limit)

        return {
            products: sorted.map(([name]) => name),
            quantities: sorted.map(([_, stats]) => stats.quantity),
            weightGrams: sorted.map(([_, stats]) => stats.weightGrams),
            sales: sorted.map(([_, stats]) => stats.sales)
        }
    }

    // Get transaction count by payment method
    const getTransactionCountByMethod = (transactions: any[]) => {
        if (transactions.length === 0) return { methods: [], counts: [] }

        const countByMethod: Record<string, number> = {}
        
        transactions.forEach(t => {
            const method = t.payment_method === 'cash' ? 'Tunai' : 'Transfer'
            if (!countByMethod[method]) {
                countByMethod[method] = 0
            }
            countByMethod[method]++
        })

        return {
            methods: Object.keys(countByMethod),
            counts: Object.values(countByMethod)
        }
    }

    // Get all items sold (sorted by revenue)
    const getAllItemsSold = (transactions: any[]) => {
        if (transactions.length === 0) return { products: [], quantities: [], weightGrams: [], sales: [] }

        const productStats: Record<string, { quantity: number; weightGrams: number; sales: number }> = {}

        transactions.forEach(t => {
            t.items?.forEach((item: any) => {
                if (!productStats[item.product_name]) {
                    productStats[item.product_name] = { quantity: 0, weightGrams: 0, sales: 0 }
                }
                const stat = productStats[item.product_name]
                if (stat) {
                    if (item.sale_mode === 'weight') {
                        stat.weightGrams += Number(item.weight_grams) || 0
                    } else {
                        stat.quantity += Number(item.quantity) || 0
                    }
                    stat.sales += Number(item.subtotal) || 0
                }
            })
        })

        // Sort by revenue (descending) so weight and unit products rank fairly
        const sorted = Object.entries(productStats)
            .sort((a, b) => b[1].sales - a[1].sales)

        return {
            products: sorted.map(([name]) => name),
            quantities: sorted.map(([_, stats]) => stats.quantity),
            weightGrams: sorted.map(([_, stats]) => stats.weightGrams),
            sales: sorted.map(([_, stats]) => stats.sales)
        }
    }

    return {
        getSalesByPaymentMethod,
        getTopSellingProducts,
        getTransactionCountByMethod,
        getAllItemsSold
    }
}
