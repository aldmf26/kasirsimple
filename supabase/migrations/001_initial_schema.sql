-- ============================================
-- KASIR SIMPLE - Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_type TEXT DEFAULT 'retail' CHECK (business_type IN ('retail', 'service', 'fnb')),
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'Rp',
    timezone TEXT DEFAULT 'Asia/Jakarta',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
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

-- Index for faster store queries
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2) DEFAULT 0,
    type TEXT DEFAULT 'product' CHECK (type IN ('product', 'service')),
    has_stock BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('indonesian', name));

-- ============================================
-- 4. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    transaction_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    discount_type TEXT DEFAULT 'nominal' CHECK (discount_type IN ('nominal', 'percent')),
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    paid NUMERIC(12, 2) DEFAULT 0,
    change NUMERIC(12, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'qris', 'debit', 'credit')),
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_number ON transactions(transaction_number);

-- ============================================
-- 5. TRANSACTION ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);

-- ============================================
-- 6. STOCK MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER,
    stock_before INTEGER,
    stock_after INTEGER,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);

-- ============================================
-- 7. PRINTER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS printer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
    printer_type TEXT DEFAULT 'thermal' CHECK (printer_type IN ('thermal', 'a4', 'none')),
    paper_width INTEGER DEFAULT 58 CHECK (paper_width IN (58, 80)),
    auto_print BOOLEAN DEFAULT false,
    include_logo BOOLEAN DEFAULT true,
    include_store_info BOOLEAN DEFAULT true,
    footer_text TEXT DEFAULT 'Terima kasih atas kunjungan Anda!',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Daily Sales Summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    store_id,
    DATE(created_at) as sale_date,
    COUNT(*) as total_transactions,
    COALESCE(SUM(total), 0) as total_sales,
    COALESCE(AVG(total), 0) as average_transaction,
    COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
    COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END), 0) as non_cash_sales
FROM transactions
GROUP BY store_id, DATE(created_at);

-- Product Sales Summary
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    COUNT(ti.id) as times_sold,
    COALESCE(SUM(ti.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(ti.subtotal), 0) as total_revenue
FROM products p
LEFT JOIN transaction_items ti ON ti.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
GROUP BY p.id, p.name, c.name;

-- Low Stock Products
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Users can view own stores" ON stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stores" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON stores
    FOR UPDATE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Products policies
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Transaction items policies
CREATE POLICY "Users can view own transaction items" ON transaction_items
    FOR SELECT USING (transaction_id IN (
        SELECT t.id FROM transactions t 
        JOIN stores s ON s.id = t.store_id 
        WHERE s.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own transaction items" ON transaction_items
    FOR INSERT WITH CHECK (transaction_id IN (
        SELECT t.id FROM transactions t 
        JOIN stores s ON s.id = t.store_id 
        WHERE s.user_id = auth.uid()
    ));

-- Stock movements policies
CREATE POLICY "Users can view own stock movements" ON stock_movements
    FOR SELECT USING (product_id IN (
        SELECT p.id FROM products p 
        JOIN stores s ON s.id = p.store_id 
        WHERE s.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own stock movements" ON stock_movements
    FOR INSERT WITH CHECK (product_id IN (
        SELECT p.id FROM products p 
        JOIN stores s ON s.id = p.store_id 
        WHERE s.user_id = auth.uid()
    ));

-- Printer settings policies
CREATE POLICY "Users can view own printer settings" ON printer_settings
    FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own printer settings" ON printer_settings
    FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own printer settings" ON printer_settings
    FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printer_settings_updated_at
    BEFORE UPDATE ON printer_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
