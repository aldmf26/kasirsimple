import dummyData from '~/utils/dummyData.json'

export interface DummyStore {
  id: string
  name: string
  owner_id: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface DummyCategory {
  id: string
  store_id: string
  name: string
  color: string
  created_at: string
}

export interface DummyProduct {
  id: string
  store_id: string
  category_id: string
  name: string
  description: string
  price: number
  stock: number
  is_active: boolean
  image_url: string
  created_at: string
  updated_at: string
}

export interface DummyTransaction {
  id: string
  store_id: string
  user_id: string
  customer_name: string
  total_amount: number
  discount_amount: number
  discount_type: 'nominal' | 'percent'
  paid_amount: number
  change_amount: number
  payment_method: string
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    price: number
    subtotal: number
  }>
  created_at: string
}

export const useDummyMode = () => {
  const isDummyMode = useState('isDummyMode', () => false)
  
  // Get dummy store
  const getDummyStore = (): DummyStore => dummyData.store as DummyStore
  
  // Get dummy categories
  const getDummyCategories = (): DummyCategory[] => 
    dummyData.categories as DummyCategory[]
  
  // Get dummy products
  const getDummyProducts = (categoryId?: string): DummyProduct[] => {
    let products = dummyData.products as DummyProduct[]
    if (categoryId && categoryId !== 'all') {
      products = products.filter(p => p.category_id === categoryId)
    }
    return products
  }
  
  // Create dummy transaction
  const createDummyTransaction = (transaction: Omit<DummyTransaction, 'id' | 'created_at'>) => {
    const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTransaction: DummyTransaction = {
      ...transaction,
      id,
      created_at: new Date().toISOString(),
    }
    
    // Add to dummy data
    if (!dummyData.transactions) {
      dummyData.transactions = []
    }
    dummyData.transactions.push(newTransaction)
    
    return newTransaction
  }
  
  // Get all dummy transactions
  const getDummyTransactions = (): DummyTransaction[] => 
    dummyData.transactions as DummyTransaction[]
  
  // Toggle dummy mode
  const toggleDummyMode = () => {
    isDummyMode.value = !isDummyMode.value
  }
  
  return {
    isDummyMode,
    getDummyStore,
    getDummyCategories,
    getDummyProducts,
    createDummyTransaction,
    getDummyTransactions,
    toggleDummyMode,
  }
}
