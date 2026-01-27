-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. STORES
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    business_type TEXT, -- retail/service/fnb
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'Rp',
    timezone TEXT DEFAULT 'Asia/Jakarta',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, name)
);

-- 3. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    category_id UUID REFERENCES categories(id),
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    cost NUMERIC(12, 2),
    type TEXT DEFAULT 'product', -- product/service
    has_stock BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    transaction_number TEXT UNIQUE,
    subtotal NUMERIC(12, 2),
    discount NUMERIC(12, 2) DEFAULT 0,
    discount_type TEXT DEFAULT 'nominal',
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2),
    paid NUMERIC(12, 2),
    change NUMERIC(12, 2),
    payment_method TEXT DEFAULT 'cash',
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTION ITEMS
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_price NUMERIC(12, 2),
    quantity INTEGER NOT NULL,
    subtotal NUMERIC(12, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK MOVEMENTS
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    transaction_id UUID REFERENCES transactions(id),
    type TEXT NOT NULL, -- in/out/adjustment
    quantity INTEGER,
    stock_before INTEGER,
    stock_after INTEGER,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRINTER SETTINGS
CREATE TABLE printer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    printer_type TEXT DEFAULT 'thermal',
    paper_width INTEGER DEFAULT 58,
    auto_print BOOLEAN DEFAULT false,
    include_logo BOOLEAN DEFAULT true,
    include_store_info BOOLEAN DEFAULT true,
    footer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id)
);

-- VIEWS

CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    store_id,
    DATE(created_at) as sale_date,
    COUNT(*) as total_transactions,
    SUM(total) as total_sales,
    AVG(total) as average_transaction,
    SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_sales,
    SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END) as non_cash_sales
FROM transactions
GROUP BY store_id, DATE(created_at);

CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    COUNT(ti.id) as times_sold,
    SUM(ti.quantity) as total_quantity_sold,
    SUM(ti.subtotal) as total_revenue
FROM products p
LEFT JOIN transaction_items ti ON ti.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.name, c.name;

CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    id,
    store_id,
    name,
    sku,
    stock,
    min_stock,
    (min_stock - stock) as shortage
FROM products
WHERE has_stock = true
  AND is_active = true
  AND stock <= min_stock
ORDER BY shortage DESC;

-- RLS (Example)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stores" ON stores
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));
