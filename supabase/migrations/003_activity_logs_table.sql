-- Activity Logs Table for Audit Trail
-- This table records all important activities in the system

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity Details
    action VARCHAR(100) NOT NULL,
    details JSONB,
    related_id VARCHAR(255),
    
    -- System Info
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT activity_logs_action_check CHECK (action != '')
);

-- Create indexes for faster queries
CREATE INDEX idx_activity_logs_store_id ON public.activity_logs(store_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_store_timestamp ON public.activity_logs(store_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see logs from their own store
CREATE POLICY "Users can view activity logs from their store" ON public.activity_logs
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE store_id = auth.uid() 
            OR auth.uid() IN (
                SELECT user_id FROM public.users 
                WHERE store_id = public.stores.id
            )
        )
    );

-- RLS Policy: System can insert activity logs
CREATE POLICY "System can insert activity logs" ON public.activity_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- Grant permissions
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT INSERT ON public.activity_logs TO authenticated;

-- Create a function to auto-log important transactions
CREATE OR REPLACE FUNCTION public.log_transaction_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_logs (store_id, user_id, action, related_id, details)
        VALUES (
            OLD.store_id,
            COALESCE(auth.uid(), OLD.created_by, gen_random_uuid()),
            'TRANSACTION_DELETED',
            OLD.id,
            jsonb_build_object(
                'transaction_number', OLD.transaction_number,
                'total', OLD.total,
                'payment_method', OLD.payment_method
            )
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (store_id, user_id, action, related_id, details)
        VALUES (
            NEW.store_id,
            COALESCE(auth.uid(), NEW.created_by, gen_random_uuid()),
            'TRANSACTION_CREATED',
            NEW.id,
            jsonb_build_object(
                'transaction_number', NEW.transaction_number,
                'total', NEW.total,
                'payment_method', NEW.payment_method
            )
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transactions
CREATE TRIGGER transaction_activity_trigger
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_activity();

-- Similar function for products
CREATE OR REPLACE FUNCTION public.log_product_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_logs (store_id, user_id, action, related_id, details)
        VALUES (
            OLD.store_id,
            auth.uid(),
            'PRODUCT_DELETED',
            OLD.id,
            jsonb_build_object(
                'product_name', OLD.name,
                'sku', OLD.sku,
                'price', OLD.price
            )
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (store_id, user_id, action, related_id, details)
        VALUES (
            NEW.store_id,
            auth.uid(),
            'PRODUCT_CREATED',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'sku', NEW.sku,
                'price', NEW.price
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_logs (store_id, user_id, action, related_id, details)
        VALUES (
            NEW.store_id,
            auth.uid(),
            'PRODUCT_UPDATED',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'old_price', OLD.price,
                'new_price', NEW.price,
                'old_stock', OLD.stock,
                'new_stock', NEW.stock
            )
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products
CREATE TRIGGER product_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION log_product_activity();

-- Function for stock movements
CREATE OR REPLACE FUNCTION public.log_stock_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (store_id, user_id, action, related_id, details)
        VALUES (
            (SELECT store_id FROM public.products WHERE id = NEW.product_id),
            auth.uid(),
            'STOCK_' || UPPER(NEW.type),
            NEW.id,
            jsonb_build_object(
                'product_id', NEW.product_id,
                'quantity', NEW.quantity,
                'stock_before', NEW.stock_before,
                'stock_after', NEW.stock_after,
                'notes', NEW.notes
            )
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock movements
CREATE TRIGGER stock_activity_trigger
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION log_stock_activity();
