-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  raised_by_id UUID NOT NULL,
  against_id UUID NOT NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('buyer_item_issue', 'buyer_not_received', 'seller_non_payment', 'seller_false_claim', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'escalated', 'closed')),
  resolution_type TEXT CHECK (resolution_type IN ('full_refund', 'partial_refund', 'no_refund', 'return_required')),
  reason TEXT NOT NULL,
  description TEXT,
  requested_amount DECIMAL(10, 2),
  approved_amount DECIMAL(10, 2),
  admin_notes TEXT,
  admin_id UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dispute_evidence table
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'document', 'screenshot', 'video', 'other')),
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new transaction statuses and dispute-related fields
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS dispute_id UUID REFERENCES public.disputes(id),
ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Update transaction status check constraint to include dispute statuses
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'paid', 'dispatched', 'delivered', 'completed', 'refunded', 'disputed_pending_review', 'disputed_under_review', 'disputed_resolved', 'cancelled'));

-- Enable RLS on disputes table
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Disputes are viewable by parties involved and admins
CREATE POLICY "Parties and admins can view disputes"
ON public.disputes
FOR SELECT
USING (
  raised_by_id = auth.uid() 
  OR against_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Users can create disputes for their transactions
CREATE POLICY "Users can create disputes"
ON public.disputes
FOR INSERT
WITH CHECK (
  raised_by_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = dispute_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Only admins can update disputes
CREATE POLICY "Admins can update disputes"
ON public.disputes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on dispute_evidence table
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Evidence is viewable by parties involved and admins
CREATE POLICY "Parties and admins can view evidence"
ON public.dispute_evidence
FOR SELECT
USING (
  uploaded_by_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.disputes 
    WHERE id = dispute_id 
    AND (raised_by_id = auth.uid() OR against_id = auth.uid())
  )
);

-- Users can upload evidence to their disputes
CREATE POLICY "Users can upload evidence"
ON public.dispute_evidence
FOR INSERT
WITH CHECK (
  uploaded_by_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.disputes 
    WHERE id = dispute_id 
    AND (raised_by_id = auth.uid() OR against_id = auth.uid())
  )
);

-- Create updated_at trigger for disputes
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON public.disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON public.disputes(raised_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON public.dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dispute_id ON public.transactions(dispute_id);