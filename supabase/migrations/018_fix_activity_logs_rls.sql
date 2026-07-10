-- Fix activity log RLS so authenticated store owners can read and write their own logs.
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view activity logs from their store" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can manage own activity logs" ON public.activity_logs;

CREATE POLICY "Users can manage own activity logs"
ON public.activity_logs
FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT id
    FROM public.stores
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  store_id IN (
    SELECT id
    FROM public.stores
    WHERE user_id = (SELECT auth.uid())
  )
  AND user_id = (SELECT auth.uid())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
