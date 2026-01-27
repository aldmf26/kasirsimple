import type { Database } from './database'

export type Store = Database['public']['Tables']['stores']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionItem = Database['public']['Tables']['transaction_items']['Row']
export type PrinterSetting = Database['public']['Tables']['printer_settings']['Row'] // Assuming this exists in DB types if I added it

// Business Logic Types
export interface CartItem {
    product: Product
    quantity: number
    subtotal: number
}

export interface Cart {
    items: CartItem[]
    subtotal: number
    discount: number
    tax: number
    total: number
}
