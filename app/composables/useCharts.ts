export const useCharts = () => {
    // Calculate sales by date for line chart
    const getSalesByDate = (transactions: any[]) => {
        if (transactions.length === 0) return { dates: [], sales: [] }

        // Group by date
        const salesByDate: Record<string, number> = {}
        
        transactions.forEach(t => {
            const date = new Date(t.created_at).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
            if (!salesByDate[date]) {
                salesByDate[date] = 0
            }
            salesByDate[date] += t.total
        })

        // Sort by date
        const sortedEntries = Object.entries(salesByDate).sort((a, b) => {
            return new Date(a[0]).getTime() - new Date(b[0]).getTime()
        })

        return {
            dates: sortedEntries.map(([date]) => date),
            sales: sortedEntries.map(([_, sales]) => sales)
        }
    }

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
        if (transactions.length === 0) return { products: [], quantities: [] }

        const productStats: Record<string, { quantity: number; sales: number }> = {}

        transactions.forEach(t => {
            t.items?.forEach((item: any) => {
                if (!productStats[item.product_name]) {
                    productStats[item.product_name] = { quantity: 0, sales: 0 }
                }
                const stat = productStats[item.product_name]
                if (stat) {
                    stat.quantity += item.quantity
                    stat.sales += item.subtotal
                }
            })
        })

        // Sort by quantity sold
        const sorted = Object.entries(productStats)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, limit)

        return {
            products: sorted.map(([name]) => name),
            quantities: sorted.map(([_, stats]) => stats.quantity),
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

    // Get all items sold (sorted by quantity)
    const getAllItemsSold = (transactions: any[]) => {
        if (transactions.length === 0) return { products: [], quantities: [], sales: [] }

        const productStats: Record<string, { quantity: number; sales: number }> = {}

        transactions.forEach(t => {
            t.items?.forEach((item: any) => {
                if (!productStats[item.product_name]) {
                    productStats[item.product_name] = { quantity: 0, sales: 0 }
                }
                const stat = productStats[item.product_name]
                if (stat) {
                    stat.quantity += item.quantity
                    stat.sales += item.subtotal
                }
            })
        })

        // Sort by quantity sold (descending)
        const sorted = Object.entries(productStats)
            .sort((a, b) => b[1].quantity - a[1].quantity)

        return {
            products: sorted.map(([name]) => name),
            quantities: sorted.map(([_, stats]) => stats.quantity),
            sales: sorted.map(([_, stats]) => stats.sales)
        }
    }

    return {
        getSalesByDate,
        getSalesByPaymentMethod,
        getTopSellingProducts,
        getTransactionCountByMethod,
        getAllItemsSold
    }
}
