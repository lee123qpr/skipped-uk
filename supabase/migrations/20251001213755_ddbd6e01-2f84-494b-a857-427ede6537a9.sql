-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view audit logs for their transactions" ON public.transaction_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.transaction_audit_log;

-- Recreate policies
CREATE POLICY "Users can view audit logs for their transactions"
ON public.transaction_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE transactions.id = transaction_audit_log.transaction_id
    AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
  )
);

CREATE POLICY "System can insert audit logs"
ON public.transaction_audit_log
FOR INSERT
WITH CHECK (true);