-- create_sale(): save one POS sale (header, items, stock, stock movements) in a
-- single DB transaction. Used online and when the offline queue syncs.
--
-- * Idempotent on the client-generated id: re-sending the same sale (retry
--   after a dropped connection) returns the stored one instead of a duplicate.
-- * Online sales get their TRX-YYYYMMDD-NNN number here, under a per-store
--   lock, so two devices can never get the same number. Offline sales come
--   with their own final number (TRX-YYYYMMDD-OFF-xxxxx).
-- * Stock never goes below 0. An offline device cannot know what other
--   devices sold, so the sale is still accepted; the product then shows up
--   in "Barang Mau Habis".
-- SECURITY INVOKER: transactions / items / products / stock_movements RLS apply.

CREATE OR REPLACE FUNCTION public.create_sale(p_sale JSONB, p_date_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id UUID := (p_sale ->> 'id')::UUID;
  v_store_id UUID := (p_sale ->> 'store_id')::UUID;
  v_number TEXT := NULLIF(p_sale ->> 'transaction_number', '');
  v_prefix TEXT;
  v_item JSONB;
  v_qty INTEGER;
  v_before INTEGER;
  v_after INTEGER;
  v_stock_unit TEXT;
  v_stock JSONB := '[]'::JSONB;
BEGIN
  IF v_id IS NULL OR v_store_id IS NULL THEN
    RAISE EXCEPTION 'Data transaksi tidak lengkap';
  END IF;

  -- Already saved (retry): return it unchanged.
  IF EXISTS (SELECT 1 FROM public.transactions WHERE id = v_id) THEN
    RETURN jsonb_build_object(
      'transaction', (SELECT to_jsonb(t) FROM public.transactions t WHERE t.id = v_id),
      'duplicate', true
    );
  END IF;

  IF v_number IS NULL THEN
    IF p_date_key !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Tanggal transaksi tidak valid';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext('trx-number:' || v_store_id::TEXT));
    v_prefix := 'TRX-' || replace(p_date_key, '-', '') || '-';
    SELECT v_prefix || lpad((COALESCE(MAX(substring(transaction_number FROM length(v_prefix) + 1)::INTEGER), 0) + 1)::TEXT, 3, '0')
    INTO v_number
    FROM public.transactions
    WHERE store_id = v_store_id
      AND transaction_number LIKE v_prefix || '%'
      AND substring(transaction_number FROM length(v_prefix) + 1) ~ '^\d+$';
  END IF;

  INSERT INTO public.transactions (
    id, store_id, transaction_number, created_at,
    subtotal, discount, discount_type, discount_from_settings,
    tax, tax_percentage, ppn, ppn_percentage,
    total, paid, change, payment_method,
    customer_name, customer_phone, customer_id, notes, created_by
  ) VALUES (
    v_id, v_store_id, v_number, COALESCE((p_sale ->> 'created_at')::TIMESTAMPTZ, NOW()),
    COALESCE((p_sale ->> 'subtotal')::NUMERIC, 0),
    COALESCE((p_sale ->> 'discount')::NUMERIC, 0),
    COALESCE(NULLIF(p_sale ->> 'discount_type', ''), 'nominal'),
    COALESCE((p_sale ->> 'discount_from_settings')::NUMERIC, 0),
    COALESCE((p_sale ->> 'tax')::NUMERIC, 0),
    (p_sale ->> 'tax_percentage')::NUMERIC,
    COALESCE((p_sale ->> 'ppn')::NUMERIC, 0),
    (p_sale ->> 'ppn_percentage')::NUMERIC,
    COALESCE((p_sale ->> 'total')::NUMERIC, 0),
    COALESCE((p_sale ->> 'paid')::NUMERIC, 0),
    COALESCE((p_sale ->> 'change')::NUMERIC, 0),
    COALESCE(NULLIF(p_sale ->> 'payment_method', ''), 'cash'),
    NULLIF(p_sale ->> 'customer_name', ''),
    NULLIF(p_sale ->> 'customer_phone', ''),
    NULLIF(p_sale ->> 'customer_id', '')::UUID,
    NULLIF(p_sale ->> 'notes', ''),
    auth.uid()
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_sale -> 'items', '[]'::JSONB)) LOOP
    INSERT INTO public.transaction_items (
      transaction_id, product_id, product_name, product_sku, product_price,
      quantity, subtotal, sale_mode, weight_grams, product_unit, base_price
    ) VALUES (
      v_id,
      NULLIF(v_item ->> 'product_id', '')::UUID,
      v_item ->> 'product_name',
      NULLIF(v_item ->> 'product_sku', ''),
      COALESCE((v_item ->> 'product_price')::NUMERIC, 0),
      COALESCE((v_item ->> 'quantity')::INTEGER, 1),
      COALESCE((v_item ->> 'subtotal')::NUMERIC, 0),
      COALESCE(NULLIF(v_item ->> 'sale_mode', ''), 'unit'),
      (v_item ->> 'weight_grams')::INTEGER,
      NULLIF(v_item ->> 'product_unit', ''),
      (v_item ->> 'base_price')::NUMERIC
    );

    -- stock_qty: pcs, or grams for weight items; 0 / missing = no stock tracking
    v_qty := COALESCE((v_item ->> 'stock_qty')::INTEGER, 0);
    CONTINUE WHEN v_qty <= 0 OR NULLIF(v_item ->> 'product_id', '') IS NULL;

    SELECT COALESCE(p.stock, 0), COALESCE(p.stock_unit, 'pcs')
    INTO v_before, v_stock_unit
    FROM public.products p
    WHERE p.id = (v_item ->> 'product_id')::UUID AND p.has_stock = true
    FOR UPDATE;
    CONTINUE WHEN NOT FOUND;

    v_after := GREATEST(0, v_before - v_qty);
    UPDATE public.products SET stock = v_after, updated_at = NOW()
    WHERE id = (v_item ->> 'product_id')::UUID;

    INSERT INTO public.stock_movements (
      product_id, transaction_id, type, quantity, stock_before, stock_after, stock_unit, notes, created_by
    ) VALUES (
      (v_item ->> 'product_id')::UUID, v_id, 'out', v_qty, v_before, v_after, v_stock_unit,
      'Penjualan: ' || v_number, auth.uid()
    );

    v_stock := v_stock || jsonb_build_object('product_id', v_item ->> 'product_id', 'stock_before', v_before, 'stock_after', v_after);
  END LOOP;

  RETURN jsonb_build_object(
    'transaction', (SELECT to_jsonb(t) FROM public.transactions t WHERE t.id = v_id),
    'items', (SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::JSONB) FROM public.transaction_items i WHERE i.transaction_id = v_id),
    'stock', v_stock,
    'duplicate', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_sale(JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sale(JSONB, TEXT) TO authenticated;
