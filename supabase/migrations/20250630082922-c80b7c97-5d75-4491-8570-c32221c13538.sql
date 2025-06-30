
-- Add columns to virtual_cards table for better tracking
ALTER TABLE public.virtual_cards 
ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transaction_at TIMESTAMP WITH TIME ZONE;

-- Create enhanced card transaction analytics view
CREATE OR REPLACE VIEW public.card_transaction_analytics AS
SELECT 
  vc.id as card_id,
  vc.user_id,
  vc.masked_card_number,
  vc.status as card_status,
  COUNT(vct.id) as total_transactions,
  COALESCE(SUM(CASE WHEN vct.transaction_type = 'purchase' THEN vct.amount ELSE 0 END), 0) as total_purchases,
  COALESCE(SUM(CASE WHEN vct.transaction_type = 'refund' THEN vct.amount ELSE 0 END), 0) as total_refunds,
  COALESCE(SUM(CASE WHEN vct.created_at >= CURRENT_DATE THEN vct.amount ELSE 0 END), 0) as daily_spent,
  COALESCE(SUM(CASE WHEN vct.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN vct.amount ELSE 0 END), 0) as monthly_spent,
  MAX(vct.created_at) as last_transaction_at,
  COUNT(CASE WHEN vct.status = 'failed' THEN 1 END) as failed_transactions,
  COUNT(CASE WHEN vct.created_at >= CURRENT_DATE THEN 1 END) as daily_transactions
FROM public.virtual_cards vc
LEFT JOIN public.virtual_card_transactions vct ON vc.id = vct.card_id
GROUP BY vc.id, vc.user_id, vc.masked_card_number, vc.status;

-- Create webhook notifications table for transaction events
CREATE TABLE IF NOT EXISTS public.card_transaction_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  card_id UUID REFERENCES public.virtual_cards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.virtual_card_transactions(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('transaction.created', 'transaction.completed', 'transaction.failed', 'card.limit_reached')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for webhook notifications
ALTER TABLE public.card_transaction_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook notifications" 
  ON public.card_transaction_webhooks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert webhook notifications" 
  ON public.card_transaction_webhooks 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to update card spending limits after transactions
CREATE OR REPLACE FUNCTION public.update_card_spending_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update card spending totals and transaction count
  UPDATE public.virtual_cards 
  SET 
    current_daily_spent = COALESCE((
      SELECT SUM(amount) 
      FROM public.virtual_card_transactions 
      WHERE card_id = NEW.card_id 
      AND transaction_type = 'purchase' 
      AND created_at >= CURRENT_DATE
    ), 0),
    current_monthly_spent = COALESCE((
      SELECT SUM(amount) 
      FROM public.virtual_card_transactions 
      WHERE card_id = NEW.card_id 
      AND transaction_type = 'purchase' 
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0),
    total_transactions = total_transactions + 1,
    last_transaction_at = NEW.created_at,
    last_used_at = NEW.created_at
  WHERE id = NEW.card_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic spending limit updates
DROP TRIGGER IF EXISTS update_card_spending_trigger ON public.virtual_card_transactions;
CREATE TRIGGER update_card_spending_trigger
  AFTER INSERT ON public.virtual_card_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_card_spending_after_transaction();

-- Create function to process card transactions with enhanced validation
CREATE OR REPLACE FUNCTION public.process_card_transaction(
  p_card_id UUID,
  p_transaction_type TEXT,
  p_amount NUMERIC DEFAULT 0,
  p_description TEXT DEFAULT '',
  p_merchant_info JSONB DEFAULT '{}',
  p_reference_id TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_record RECORD;
  v_user_id UUID;
  v_transaction_id UUID;
  v_daily_remaining NUMERIC;
  v_monthly_remaining NUMERIC;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Get card details with lock
  SELECT * INTO v_card_record
  FROM public.virtual_cards
  WHERE id = p_card_id AND user_id = v_user_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Card not found or inactive');
  END IF;
  
  -- Calculate remaining limits
  v_daily_remaining := v_card_record.daily_limit - v_card_record.current_daily_spent;
  v_monthly_remaining := v_card_record.monthly_limit - v_card_record.current_monthly_spent;
  
  -- Validate transaction amount against limits (for purchases)
  IF p_transaction_type = 'purchase' THEN
    IF p_amount > v_daily_remaining THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Daily spending limit exceeded',
        'daily_remaining', v_daily_remaining
      );
    END IF;
    
    IF p_amount > v_monthly_remaining THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Monthly spending limit exceeded',
        'monthly_remaining', v_monthly_remaining
      );
    END IF;
  END IF;
  
  -- Create transaction record
  INSERT INTO public.virtual_card_transactions (
    card_id, user_id, transaction_type, amount, description, 
    merchant_info, reference_id, status
  ) VALUES (
    p_card_id, v_user_id, p_transaction_type, p_amount, p_description,
    p_merchant_info, COALESCE(p_reference_id, 'TXN-' || extract(epoch from now())::bigint), 'completed'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'daily_remaining', v_daily_remaining - CASE WHEN p_transaction_type = 'purchase' THEN p_amount ELSE 0 END,
    'monthly_remaining', v_monthly_remaining - CASE WHEN p_transaction_type = 'purchase' THEN p_amount ELSE 0 END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Transaction processing failed: ' || SQLERRM);
END;
$$;
