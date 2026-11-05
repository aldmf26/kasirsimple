-- Customer debt (kasbon) installments.
--
-- A debt is a completed transaction with paid < total. Each installment is a
-- debt_payments row and is also added to transactions.paid, so receipts,
-- nota and reports keep showing the right remaining amount. Cash reports
-- count an installment on the day/shift it was received (debt_payments),
-- and subtract it from the original sale so it is never counted twice.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS debt_remaining NUMERIC(12, 2)
  GENERATED ALWAYS AS (GREATEST(COALESCE(total, 0) - COALESCE(paid, 0), 0)) STORED;

CREATE INDEX IF NOT EXISTS idx_transactions_store_debt
  ON public.transactions (store_id, created_at)
  WHERE debt_remaining > 0;

CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_store_created ON public.debt_payments (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debt_payments_transaction ON public.debt_payments (transaction_id);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Debt payments select own store" ON public.debt_payments;
CREATE POLICY "Debt payments select own store" ON public.debt_payments
  FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Debt payments insert own store" ON public.debt_payments;
CREATE POLICY "Debt payments insert own store" ON public.debt_payments
  FOR INSERT TO authenticated
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- No UPDATE/DELETE: an installment must stay in sync with transactions.paid.
-- Rows go away only with their transaction (ON DELETE CASCADE).
GRANT SELECT, INSERT ON public.debt_payments TO authenticated;

-- Pay p_amount towards the given transactions in the given order (the client
-- sends oldest first). Rows are locked, so two devices cannot overpay the same
-- nota. Over-payment beyond the total remaining is rejected.
-- SECURITY INVOKER: transactions / debt_payments RLS still apply.
CREATE OR REPLACE FUNCTION public.pay_debts(
  p_transaction_ids UUID[],
  p_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'cash',
  p_note TEXT DEFAULT NULL,
  p_paid_off_label TEXT DEFAULT NULL
)
RETURNS TABLE (transaction_id UUID, amount_applied NUMERIC, remaining NUMERIC)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_left NUMERIC := ROUND(COALESCE(p_amount, 0), 2);
  v_total_remaining NUMERIC;
  v_id UUID;
  v_tx RECORD;
  v_apply NUMERIC;
BEGIN
  IF v_left <= 0 THEN
    RAISE EXCEPTION 'Jumlah bayar harus lebih dari 0';
  END IF;

  -- Lock in a fixed order (by id) to avoid deadlocks, then allocate in the caller's order.
  PERFORM 1 FROM public.transactions
  WHERE id = ANY (p_transaction_ids)
  ORDER BY id
  FOR UPDATE;

  SELECT COALESCE(SUM(GREATEST(COALESCE(t.total, 0) - COALESCE(t.paid, 0), 0)), 0)
  INTO v_total_remaining
  FROM public.transactions t
  WHERE t.id = ANY (p_transaction_ids) AND t.status = 'completed';

  IF v_left > v_total_remaining THEN
    RAISE EXCEPTION 'Jumlah bayar melebihi sisa hutang (Rp %)', v_total_remaining;
  END IF;

  FOREACH v_id IN ARRAY p_transaction_ids LOOP
    EXIT WHEN v_left <= 0;

    SELECT t.id, t.store_id, COALESCE(t.total, 0) AS total, COALESCE(t.paid, 0) AS paid, t.notes, t.status
    INTO v_tx
    FROM public.transactions t
    WHERE t.id = v_id;

    CONTINUE WHEN NOT FOUND OR v_tx.status <> 'completed' OR v_tx.paid >= v_tx.total;

    v_apply := LEAST(v_left, v_tx.total - v_tx.paid);

    INSERT INTO public.debt_payments (store_id, transaction_id, amount, payment_method, note, created_by)
    VALUES (v_tx.store_id, v_tx.id, v_apply, COALESCE(NULLIF(p_payment_method, ''), 'cash'), NULLIF(p_note, ''), auth.uid());

    UPDATE public.transactions t
    SET paid = v_tx.paid + v_apply,
        change = 0,
        notes = CASE
          WHEN v_tx.paid + v_apply >= v_tx.total AND p_paid_off_label IS NOT NULL THEN
            NULLIF(TRIM(regexp_replace(COALESCE(v_tx.notes, ''), '\[HUTANG:[^\]]*\]', '[LUNAS ' || p_paid_off_label || ']', 'g')), '')
          ELSE t.notes
        END
    WHERE t.id = v_tx.id;

    v_left := v_left - v_apply;
    transaction_id := v_tx.id;
    amount_applied := v_apply;
    remaining := v_tx.total - v_tx.paid - v_apply;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.pay_debts(UUID[], NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pay_debts(UUID[], NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
