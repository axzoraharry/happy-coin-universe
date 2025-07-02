
-- Create a function to lookup card by number and return card details with user verification
CREATE OR REPLACE FUNCTION public.get_card_by_number(p_card_number text, p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  card_id uuid,
  user_id uuid,
  status text,
  daily_limit numeric,
  monthly_limit numeric,
  current_daily_spent numeric,
  current_monthly_spent numeric,
  expiry_date date,
  masked_card_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- If user_id is provided, verify ownership
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      vc.id,
      vc.user_id,
      vc.status,
      vc.daily_limit,
      vc.monthly_limit,
      vc.current_daily_spent,
      vc.current_monthly_spent,
      vc.expiry_date,
      vc.masked_card_number
    FROM public.virtual_cards vc
    WHERE vc.user_id = p_user_id 
    AND vc.status != 'deleted'
    AND EXISTS(
      SELECT 1 FROM public.virtual_cards 
      WHERE id = vc.id 
      AND crypt(p_card_number, card_number_encrypted) = card_number_encrypted
    );
  ELSE
    -- For API usage without user context, just verify card exists
    RETURN QUERY
    SELECT 
      vc.id,
      vc.user_id,
      vc.status,
      vc.daily_limit,
      vc.monthly_limit,
      vc.current_daily_spent,
      vc.current_monthly_spent,
      vc.expiry_date,
      vc.masked_card_number
    FROM public.virtual_cards vc
    WHERE vc.status != 'deleted'
    AND EXISTS(
      SELECT 1 FROM public.virtual_cards 
      WHERE id = vc.id 
      AND crypt(p_card_number, card_number_encrypted) = card_number_encrypted
    );
  END IF;
END;
$function$;

-- Update the process_card_transaction function to accept card_number
CREATE OR REPLACE FUNCTION public.process_card_transaction_by_number(
  p_card_number text, 
  p_transaction_type text, 
  p_amount numeric DEFAULT 0, 
  p_description text DEFAULT ''::text, 
  p_merchant_info jsonb DEFAULT '{}'::jsonb, 
  p_reference_id text DEFAULT NULL::text,
  p_user_id uuid DEFAULT NULL::text
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

-- Update validate transaction limits function to work with card numbers
CREATE OR REPLACE FUNCTION public.validate_transaction_limits_by_number(p_card_number text, p_amount numeric, p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_card_record RECORD;
  v_daily_remaining NUMERIC;
  v_monthly_remaining NUMERIC;
BEGIN
  -- Get card details by number
  SELECT * INTO v_card_record
  FROM public.get_card_by_number(p_card_number, p_user_id)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Card not found or access denied');
  END IF;
  
  IF v_card_record.status != 'active' THEN
    RETURN json_build_object('valid', false, 'error', 'Card is not active');
  END IF;
  
  v_daily_remaining := v_card_record.daily_limit - v_card_record.current_daily_spent;
  v_monthly_remaining := v_card_record.monthly_limit - v_card_record.current_monthly_spent;
  
  IF p_amount > v_daily_remaining THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Transaction exceeds daily limit',
      'daily_remaining', v_daily_remaining,
      'monthly_remaining', v_monthly_remaining,
      'daily_limit', v_card_record.daily_limit
    );
  END IF;
  
  IF p_amount > v_monthly_remaining THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'Transaction exceeds monthly limit',
      'daily_remaining', v_daily_remaining,
      'monthly_remaining', v_monthly_remaining,
      'daily_limit', v_card_record.daily_limit
    );
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'daily_remaining', v_daily_remaining,
    'monthly_remaining', v_monthly_remaining,
    'daily_limit', v_card_record.daily_limit
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('valid', false, 'error', 'Validation failed: ' || SQLERRM);
END;
$function$;
