-- Add RLS policy for admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));