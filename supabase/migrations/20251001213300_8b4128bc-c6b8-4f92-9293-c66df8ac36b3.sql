-- Create transaction audit log table
CREATE TABLE IF NOT EXISTS public.transaction_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  old_status text,
  new_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy: users can view audit logs for their transactions
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

-- Create policy: system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.transaction_audit_log
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_transaction_id ON public.transaction_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.transaction_audit_log(created_at DESC);

-- Create function to log transaction status changes
CREATE OR REPLACE FUNCTION public.log_transaction_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.transaction_audit_log (
      transaction_id,
      user_id,
      action,
      old_status,
      new_status,
      metadata
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.buyer_id), -- Fallback to buyer_id if no auth context
      'status_change',
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'amount', NEW.amount,
        'listing_id', NEW.listing_id,
        'buyer_id', NEW.buyer_id,
        'seller_id', NEW.seller_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for transaction status changes
DROP TRIGGER IF EXISTS transaction_status_change_audit ON public.transactions;
CREATE TRIGGER transaction_status_change_audit
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.log_transaction_status_change();