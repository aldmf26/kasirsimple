-- Weight-based sales support (telur per kg) without breaking existing data.
-- Defaults keep every store on the old unit-based behavior until a store
-- explicitly enables weight mode and a product is switched to 'weight'.

-- ============================================
-- 1. STORE SETTINGS
-- ============================================
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS weight_mode_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS customer_required BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS barcode_enabled BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- 2. PRODUCTS
-- ============================================
-- sale_mode: 'unit' (pcs/bks/rak/ikat) | 'weight' (kg)
-- price is per unit for 'unit' and per kg for 'weight'.
-- stock/min_stock follow stock_unit: 'pcs' or 'gram'.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sale_mode TEXT NOT NULL DEFAULT 'unit';

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_unit TEXT NOT NULL DEFAULT 'pcs';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_sale_mode_check'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_sale_mode_check
        CHECK (sale_mode IN ('unit', 'weight'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_stock_unit_check'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_stock_unit_check
        CHECK (stock_unit IN ('pcs', 'gram'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_store_sale_mode
ON public.products(store_id, sale_mode);

COMMENT ON COLUMN public.products.sale_mode IS 'unit = sold per pcs/bks/rak/ikat, weight = sold per kg.';
COMMENT ON COLUMN public.products.stock_unit IS 'Stock unit used by stock and min_stock. weight products use gram.';

-- ============================================
-- 3. TRANSACTION ITEMS
-- ============================================
-- product_price keeps its meaning: unit price, or price per kg when
-- sale_mode = 'weight'. weight_grams is the actual weight sold in grams.
-- base_price stores the catalog price at sale time so edited prices can be
-- audited. subtotal is always the final amount charged for the line.
ALTER TABLE public.transaction_items
ADD COLUMN IF NOT EXISTS sale_mode TEXT NOT NULL DEFAULT 'unit';

ALTER TABLE public.transaction_items
ADD COLUMN IF NOT EXISTS weight_grams INTEGER;

ALTER TABLE public.transaction_items
ADD COLUMN IF NOT EXISTS product_unit TEXT;

ALTER TABLE public.transaction_items
ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transaction_items_sale_mode_check'
    ) THEN
        ALTER TABLE public.transaction_items
        ADD CONSTRAINT transaction_items_sale_mode_check
        CHECK (sale_mode IN ('unit', 'weight'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transaction_items_weight_grams_check'
    ) THEN
        ALTER TABLE public.transaction_items
        ADD CONSTRAINT transaction_items_weight_grams_check
        CHECK (weight_grams IS NULL OR weight_grams > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transaction_items_weight_quantity_check'
    ) THEN
        ALTER TABLE public.transaction_items
        ADD CONSTRAINT transaction_items_weight_quantity_check
        CHECK (sale_mode = 'unit' OR quantity = 1);
    END IF;
END $$;

COMMENT ON COLUMN public.transaction_items.weight_grams IS 'Weight sold in grams for weight-based lines, NULL for unit lines.';
COMMENT ON COLUMN public.transaction_items.product_unit IS 'Display unit for the line (pcs, kg, rak, ikat, ...).';
COMMENT ON COLUMN public.transaction_items.base_price IS 'Catalog price per unit/kg before any manual price edit.';

-- ============================================
-- 4. STOCK MOVEMENTS
-- ============================================
-- quantity stays INTEGER and follows stock_unit (pcs or gram).
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS stock_unit TEXT NOT NULL DEFAULT 'pcs';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'stock_movements_stock_unit_check'
    ) THEN
        ALTER TABLE public.stock_movements
        ADD CONSTRAINT stock_movements_stock_unit_check
        CHECK (stock_unit IN ('pcs', 'gram'));
    END IF;
END $$;

COMMENT ON COLUMN public.stock_movements.stock_unit IS 'Unit of quantity/stock_before/stock_after for this movement.';
