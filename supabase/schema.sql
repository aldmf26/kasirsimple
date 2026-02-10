-- ============================================
-- KasirOK Database Schema
-- Supabase (PostgreSQL)
-- Last updated: 2026-02-10
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. STORES (Toko)
-- ============================================
-- Tabel utama yang menyimpan data toko.
-- Setiap user (auth.users) hanya memiliki 1 toko aktif.
-- ============================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_type TEXT,                                -- retail / service / fnb
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'Rp',
    timezone TEXT DEFAULT 'Asia/Jakarta',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Payment & Display Settings
    enabled_payment_methods TEXT DEFAULT '["cash"]',   -- JSON array: ["cash", "qris", "card"]
    bank_accounts TEXT DEFAULT '[]',                   -- JSON array: [{"id","accountName","bank","accountNumber"}]
    show_product_images BOOLEAN DEFAULT true,
    discount_tax_settings JSONB                        -- JSON: {discount_global, discount_nominal, tax, ppn}
);

-- ============================================
-- 2. CATEGORIES (Kategori Produk)
-- ============================================
-- Pengelompokan produk berdasarkan kategori.
-- Relasi: stores (1) -> categories (N)
-- ============================================
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

-- ============================================
-- 3. PRODUCTS (Produk)
-- ============================================
-- Daftar produk/jasa yang dijual.
-- Relasi: stores (1) -> products (N)
-- Relasi: categories (1) -> products (N)
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,                     -- Harga jual
    buy_price NUMERIC(12, 2),                          -- Harga beli/modal
    type TEXT DEFAULT 'product',                        -- product / service
    unit TEXT DEFAULT 'pcs',
    has_stock BOOLEAN DEFAULT true,                     -- false untuk jasa/service
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,                        -- Threshold stok menipis
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,                  -- Produk favorit (quick access di POS)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TRANSACTIONS (Transaksi)
-- ============================================
-- Setiap transaksi penjualan yang berhasil.
-- Relasi: stores (1) -> transactions (N)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,                 -- Diskon manual dari kasir
    discount_type TEXT DEFAULT 'nominal',               -- nominal / percent
    discount_from_settings NUMERIC(12, 2) DEFAULT 0,   -- Diskon otomatis dari pengaturan toko
    tax NUMERIC(12, 2) DEFAULT 0,                      -- Pajak (tax) nominal
    tax_percentage NUMERIC(12, 2),                      -- Tax % saat transaksi
    ppn NUMERIC(12, 2) DEFAULT 0,                      -- PPN nominal
    ppn_percentage NUMERIC(12, 2),                      -- PPN % saat transaksi
    total NUMERIC(12, 2) NOT NULL,
    paid NUMERIC(12, 2) NOT NULL,
    change NUMERIC(12, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',                 -- cash / qris / card
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, transaction_number)
);

-- ============================================
-- 5. TRANSACTION ITEMS (Item Transaksi)
-- ============================================
-- Detail item di setiap transaksi.
-- Relasi: transactions (1) -> transaction_items (N)
-- ============================================
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

-- ============================================
-- 6. STOCK MOVEMENTS (Riwayat Stok)
-- ============================================
-- Log semua pergerakan stok (masuk, keluar, adjustment).
-- Relasi: products (1) -> stock_movements (N)
-- Relasi: transactions (1) -> stock_movements (N) [optional]
-- ============================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL,                                 -- in / out / adjustment
    quantity INTEGER NOT NULL,
    stock_before INTEGER,
    stock_after INTEGER,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PRINTER SETTINGS (Pengaturan Printer)
-- ============================================
-- Konfigurasi printer struk thermal per toko.
-- Relasi: stores (1) -> printer_settings (1)
-- ============================================
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

-- ============================================
-- INDEXES (Optimasi Query)
-- ============================================
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);

-- ============================================
-- VIEWS (Tampilan Ringkasan)
-- ============================================

-- Ringkasan penjualan harian
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
    store_id,
    DATE(created_at) AS sale_date,
    COUNT(*) AS total_transactions,
    SUM(total) AS total_sales,
    AVG(total) AS average_transaction,
    SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) AS cash_sales,
    SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END) AS non_cash_sales
FROM transactions
GROUP BY store_id, DATE(created_at);

-- Ringkasan penjualan per produk
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT
    p.id AS product_id,
    p.store_id,
    p.name AS product_name,
    c.name AS category_name,
    COUNT(ti.id) AS times_sold,
    SUM(ti.quantity) AS total_quantity_sold,
    SUM(ti.subtotal) AS total_revenue
FROM products p
LEFT JOIN transaction_items ti ON ti.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.store_id, p.name, c.name;

-- Produk dengan stok menipis
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
    id,
    store_id,
    name,
    sku,
    stock,
    min_stock,
    (min_stock - stock) AS shortage
FROM products
WHERE has_stock = true
  AND is_active = true
  AND stock <= min_stock
ORDER BY shortage DESC;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Memastikan setiap user hanya bisa akses data toko miliknya sendiri.
-- ============================================

-- STORES
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stores" ON stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own stores" ON stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stores" ON stores FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stores" ON stores FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view categories of their stores" ON categories FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can create categories in their stores" ON categories FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update categories in their stores" ON categories FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())) WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete categories in their stores" ON categories FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view products of their stores" ON products FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can create products in their stores" ON products FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update products in their stores" ON products FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())) WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete products in their stores" ON products FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transactions of their stores" ON transactions FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can create transactions in their stores" ON transactions FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- TRANSACTION ITEMS
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transaction items from their stores" ON transaction_items FOR SELECT USING (transaction_id IN (SELECT id FROM transactions WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())));
CREATE POLICY "Users can create transaction items in their stores" ON transaction_items FOR INSERT WITH CHECK (transaction_id IN (SELECT id FROM transactions WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())));

-- STOCK MOVEMENTS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view stock movements of their products" ON stock_movements FOR SELECT USING (product_id IN (SELECT id FROM products WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())));
CREATE POLICY "Users can create stock movements for their products" ON stock_movements FOR INSERT WITH CHECK (product_id IN (SELECT id FROM products WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())));

-- PRINTER SETTINGS
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view printer settings of their stores" ON printer_settings FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update printer settings of their stores" ON printer_settings FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())) WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert printer settings for their stores" ON printer_settings FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));-- Create expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'gaji', 'listrik', 'sewa', 'bahan_baku', 'lainnya'
    amount BIGINT NOT NULL CHECK (amount > 0),
    date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage expenses for their store." ON expenses
    FOR ALL
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_expenses_modtime
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
-- Ensure RLS is enabled
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Users can create own stores" ON stores;
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

-- Recreate policies with explicit roles
CREATE POLICY "Enable insert for authenticated users only" ON stores
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users based on user_id" ON stores
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON stores
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON stores
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
