
-- First, let's drop the existing function if it exists and recreate it with the correct signature
DROP FUNCTION IF EXISTS public.process_card_transaction_by_number(text, text, numeric, text, jsonb, text, text);

-- Recreate the function with the correct parameter order and types
CREATE OR REPLACE FUNCTION public.process_card_transaction_by_number(
  p_card_number text, 
  p_transaction_type text, 
  p_amount numeric DEFAULT 0, 
  p_description text DEFAULT ''::text, 
  p_merchant_info jsonb DEFAULT '{}'::jsonb, 
  p_reference_id text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_card_record RECORD;
  v_transaction_id UUID;
  v_daily_remaining NUMERIC;
  v_monthly_remaining NUMERIC;
BEGIN
  -- Get card details by number
  SELECT * INTO v_card_record
  FROM public.get_card_by_number(p_card_number, p_user_id)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Card not found or access denied');
  END IF;
  
  IF v_card_record.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Card is not active');
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
    v_card_record.card_id, v_card_record.user_id, p_transaction_type, p_amount, p_description,
    p_merchant_info, COALESCE(p_reference_id, 'TXN-' || extract(epoch from now())::bigint), 'completed'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'card_id', v_card_record.card_id,
    'daily_remaining', v_daily_remaining - CASE WHEN p_transaction_type = 'purchase' THEN p_amount ELSE 0 END,
    'monthly_remaining', v_monthly_remaining - CASE WHEN p_transaction_type = 'purchase' THEN p_amount ELSE 0 END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Transaction processing failed: ' || SQLERRM);
END;
$function$;
