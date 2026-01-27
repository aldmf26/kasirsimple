export interface Product {
    id: number
    name: string
    price: number
    image: string
    category: string
    description: string
    stock: number
}

export interface TransactionItem {
    product_id: number
    product_name: string
    product_price: number
    quantity: number
    subtotal: number
}

export interface Transaction {
    id: number
    transaction_number: string
    items: TransactionItem[]
    subtotal: number
    discount: number
    discount_type: 'nominal' | 'percent'
    total: number
    paid: number
    change: number
    payment_method: string
    customer_name?: string
    customer_phone?: string
    created_at: string
}

export const useDummyData = () => {
    const categories = useState('categories', () => [
        { id: 1, name: 'Semua', value: 'all' },
        { id: 2, name: 'Makanan', value: 'food' },
        { id: 3, name: 'Minuman', value: 'drinks' },
        { id: 4, name: 'Snack', value: 'snack' },
        { id: 5, name: 'Dessert', value: 'dessert' },
    ])

    const products = useState<Product[]>('products', () => [
        {
            id: 1,
            name: 'Nasi Goreng Spesial',
            price: 25000,
            image: 'https://images.unsplash.com/photo-1603133872878-684f57143026?q=80&w=500&auto=format&fit=crop',
            category: 'food',
            description: 'Nasi goreng dengan telur, ayam, dan kerupuk',
            stock: 50
        },
        {
            id: 2,
            name: 'Ayam Bakar Madu',
            price: 35000,
            image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=500&auto=format&fit=crop',
            category: 'food',
            description: 'Ayam bakar dengan bumbu madu spesial',
            stock: 30
        },
        {
            id: 3,
            name: 'Es Teh Manis',
            price: 5000,
            image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=500&auto=format&fit=crop',
            category: 'drinks',
            description: 'Teh manis dingin segar',
            stock: 100
        },
        {
            id: 4,
            name: 'Kopi Susu Gula Aren',
            price: 18000,
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=500&auto=format&fit=crop',
            category: 'drinks',
            description: 'Kopi susu kekinian dengan gula aren',
            stock: 45
        },
        {
            id: 5,
            name: 'Kentang Goreng',
            price: 15000,
            image: 'https://images.unsplash.com/photo-1630384060421-a4323ceca5f6?q=80&w=500&auto=format&fit=crop',
            category: 'snack',
            description: 'Kentang goreng renyah dengan saus sambal',
            stock: 60
        },
        {
            id: 6,
            name: 'Pisang Bakar Coklat',
            price: 12000,
            image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=500&auto=format&fit=crop',
            category: 'dessert',
            description: 'Pisang bakar dengan topping coklat dan keju',
            stock: 25
        },
        {
            id: 7,
            name: 'Mie Goreng Jawa',
            price: 22000,
            image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=500&auto=format&fit=crop',
            category: 'food',
            description: 'Mie goreng khas jawa dengan sayuran',
            stock: 40
        },
        {
            id: 8,
            name: 'Jus Jeruk',
            price: 10000,
            image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=500&auto=format&fit=crop',
            category: 'drinks',
            description: 'Jus jeruk murni segar',
            stock: 80
        }
    ])

    const transactions = useState<Transaction[]>('transactions', () => [])

    const addProduct = (product: any) => {
        const newProduct = { ...product, id: Date.now() }
        products.value.push(newProduct)
        return newProduct
    }

    const updateProduct = (id: number, updatedData: any) => {
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
            products.value[index] = { ...products.value[index], ...updatedData }
        }
    }

    const deleteProduct = (id: number) => {
        products.value = products.value.filter(p => p.id !== id)
    }

    const addTransaction = (transaction: Transaction) => {
        transactions.value.unshift(transaction) // Add to beginning
    }

    return {
        categories,
        products,
        transactions,
        addProduct,
        updateProduct,
        deleteProduct,
        addTransaction
    }
}
