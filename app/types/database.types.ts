export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            stores: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    business_type: string | null
                    address: string | null
                    phone: string | null
                    logo_url: string | null
                    currency: string
                    timezone: string
                    is_active: boolean
                    enabled_payment_methods: string | null
                    bank_accounts: string | null
                    show_product_images: boolean
                    discount_tax_settings: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    name: string
                    business_type?: string | null
                    address?: string | null
                    phone?: string | null
                    logo_url?: string | null
                    currency?: string
                    timezone?: string
                    is_active?: boolean
                    enabled_payment_methods?: string | null
                    bank_accounts?: string | null
                    show_product_images?: boolean
                    discount_tax_settings?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    business_type?: string | null
                    address?: string | null
                    phone?: string | null
                    logo_url?: string | null
                    currency?: string
                    timezone?: string
                    is_active?: boolean
                    enabled_payment_methods?: string | null
                    bank_accounts?: string | null
                    show_product_images?: boolean
                    discount_tax_settings?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    store_id: string
                    name: string
                    description: string | null
                    color: string
                    icon: string | null
                    sort_order: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    name: string
                    description?: string | null
                    color?: string
                    icon?: string | null
                    sort_order?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    name?: string
                    description?: string | null
                    color?: string
                    icon?: string | null
                    sort_order?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    store_id: string
                    category_id: string | null
                    sku: string | null
                    name: string
                    description: string | null
                    price: number
                    cost: number | null
                    buy_price: number | null
                    type: string
                    has_stock: boolean
                    stock: number
                    min_stock: number
                    unit: string | null
                    image_url: string | null
                    is_favorite: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    category_id?: string | null
                    sku?: string | null
                    name: string
                    description?: string | null
                    price: number
                    cost?: number | null
                    buy_price?: number | null
                    type?: string
                    has_stock?: boolean
                    stock?: number
                    min_stock?: number
                    unit?: string | null
                    image_url?: string | null
                    is_favorite?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    category_id?: string | null
                    sku?: string | null
                    name?: string
                    description?: string | null
                    price?: number
                    cost?: number | null
                    buy_price?: number | null
                    type?: string
                    has_stock?: boolean
                    stock?: number
                    min_stock?: number
                    unit?: string | null
                    image_url?: string | null
                    is_favorite?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    store_id: string
                    transaction_number: string
                    subtotal: number
                    discount: number
                    discount_type: string
                    discount_from_settings: number
                    tax: number
                    tax_percentage: number | null
                    ppn: number
                    ppn_percentage: number | null
                    total: number
                    paid: number
                    change: number
                    payment_method: string
                    customer_name: string | null
                    customer_phone: string | null
                    notes: string | null
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    transaction_number: string
                    subtotal: number
                    discount?: number
                    discount_type?: string
                    discount_from_settings?: number
                    tax?: number
                    tax_percentage?: number | null
                    ppn?: number
                    ppn_percentage?: number | null
                    total: number
                    paid: number
                    change: number
                    payment_method?: string
                    customer_name?: string | null
                    customer_phone?: string | null
                    notes?: string | null
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    transaction_number?: string
                    subtotal?: number
                    discount?: number
                    discount_type?: string
                    discount_from_settings?: number
                    tax?: number
                    tax_percentage?: number | null
                    ppn?: number
                    ppn_percentage?: number | null
                    total?: number
                    paid?: number
                    change?: number
                    payment_method?: string
                    customer_name?: string | null
                    customer_phone?: string | null
                    notes?: string | null
                    created_by?: string
                    created_at?: string
                }
            }
            transaction_items: {
                Row: {
                    id: string
                    transaction_id: string
                    product_id: string | null
                    product_name: string
                    product_sku: string | null
                    product_price: number
                    quantity: number
                    subtotal: number
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    product_id?: string | null
                    product_name: string
                    product_sku?: string | null
                    product_price: number
                    quantity: number
                    subtotal: number
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    transaction_id?: string
                    product_id?: string | null
                    product_name?: string
                    product_sku?: string | null
                    product_price?: number
                    quantity?: number
                    subtotal?: number
                    notes?: string | null
                    created_at?: string
                }
            }
            stock_movements: {
                Row: {
                    id: string
                    product_id: string | null
                    transaction_id: string | null
                    type: string
                    quantity: number | null
                    stock_before: number | null
                    stock_after: number | null
                    notes: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    transaction_id?: string | null
                    type: string
                    quantity?: number | null
                    stock_before?: number | null
                    stock_after?: number | null
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    transaction_id?: string | null
                    type?: string
                    quantity?: number | null
                    stock_before?: number | null
                    stock_after?: number | null
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            printer_settings: {
                Row: {
                    id: string
                    store_id: string
                    printer_type: string
                    paper_width: number
                    auto_print: boolean
                    include_logo: boolean
                    include_store_info: boolean
                    footer_text: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    printer_type?: string
                    paper_width?: number
                    auto_print?: boolean
                    include_logo?: boolean
                    include_store_info?: boolean
                    footer_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    printer_type?: string
                    paper_width?: number
                    auto_print?: boolean
                    include_logo?: boolean
                    include_store_info?: boolean
                    footer_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            daily_sales_summary: {
                Row: {
                    store_id: string
                    sale_date: string
                    total_transactions: number
                    total_sales: number
                    average_transaction: number
                    cash_sales: number
                    non_cash_sales: number
                }
            }
            product_sales_summary: {
                Row: {
                    product_id: string
                    product_name: string
                    category_name: string | null
                    times_sold: number
                    total_quantity_sold: number
                    total_revenue: number
                }
            }
            low_stock_products: {
                Row: {
                    id: string
                    store_id: string
                    name: string
                    sku: string | null
                    stock: number
                    min_stock: number
                    shortage: number
                }
            }
        }
    }
}
