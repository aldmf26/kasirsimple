-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. STORES
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#10B981',
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
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    buy_price NUMERIC(12, 2),
    type TEXT DEFAULT 'product', -- product/service
    unit TEXT DEFAULT 'pcs',
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
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    discount_type TEXT DEFAULT 'nominal',
    total NUMERIC(12, 2) NOT NULL,
    paid NUMERIC(12, 2) NOT NULL,
    change NUMERIC(12, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, transaction_number)
);

-- 5. TRANSACTION ITEMS
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK MOVEMENTS
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- in/out/adjustment
    quantity INTEGER NOT NULL,
    stock_before INTEGER,
    stock_after INTEGER,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRINTER SETTINGS
CREATE TABLE printer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
    printer_type TEXT DEFAULT 'thermal',
    paper_width INTEGER DEFAULT 58,
    auto_print BOOLEAN DEFAULT false,
    include_logo BOOLEAN DEFAULT true,
    include_store_info BOOLEAN DEFAULT true,
    footer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);

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
    p.store_id,
    p.name as product_name,
    c.name as category_name,
    COUNT(ti.id) as times_sold,
    SUM(ti.quantity) as total_quantity_sold,
    SUM(ti.subtotal) as total_revenue
FROM products p
LEFT JOIN transaction_items ti ON ti.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.store_id, p.name, c.name;

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

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- STORES TABLE
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stores" ON stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stores" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON stores
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores" ON stores
    FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES TABLE
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of their stores" ON categories
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create categories in their stores" ON categories
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update categories in their stores" ON categories
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete categories in their stores" ON categories
    FOR DELETE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- PRODUCTS TABLE
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products of their stores" ON products
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create products in their stores" ON products
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update products in their stores" ON products
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete products in their stores" ON products
    FOR DELETE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- TRANSACTIONS TABLE
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of their stores" ON transactions
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create transactions in their stores" ON transactions
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view their transaction details" ON transactions
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- TRANSACTION ITEMS TABLE
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transaction items from their stores" ON transaction_items
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM transactions WHERE store_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
    );

-- STOCK MOVEMENTS TABLE
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stock movements of their products" ON stock_movements
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM products WHERE store_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create stock movements for their products" ON stock_movements
    FOR INSERT WITH CHECK (
        product_id IN (
            SELECT id FROM products WHERE store_id IN (
                SELECT id FROM stores WHERE user_id = auth.uid()
            )
        )
    );

-- PRINTER SETTINGS TABLE
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view printer settings of their stores" ON printer_settings
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update printer settings of their stores" ON printer_settings
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert printer settings for their stores" ON printer_settings
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );