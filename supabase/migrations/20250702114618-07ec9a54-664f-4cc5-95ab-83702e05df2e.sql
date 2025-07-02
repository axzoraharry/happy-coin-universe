-- Update the issue_virtual_card function to store full card number in masked_card_number column
CREATE OR REPLACE FUNCTION public.issue_virtual_card(p_user_id uuid, p_pin text, p_daily_limit numeric DEFAULT 5000.00, p_monthly_limit numeric DEFAULT 50000.00)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_card_id UUID;
  v_card_number TEXT;
  v_cvv TEXT;
  v_expiry_date DATE;
  v_pin_hash TEXT;
  v_card_number_encrypted TEXT;
  v_cvv_encrypted TEXT;
  v_salt_rounds INTEGER := 12;
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Generate card details
  BEGIN
    v_card_number := public.generate_card_number();
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Failed to generate unique card number: ' || SQLERRM);
  END;
  
  v_cvv := public.generate_cvv();
  v_expiry_date := CURRENT_DATE + INTERVAL '3 years';
  
  -- Hash PIN and encrypt sensitive data with individual salts
  v_pin_hash := crypt(p_pin, gen_salt('bf', v_salt_rounds));
  v_card_number_encrypted := crypt(v_card_number, gen_salt('bf', v_salt_rounds));
  v_cvv_encrypted := crypt(v_cvv, gen_salt('bf', v_salt_rounds));
  
  -- Insert new card with full card number in masked_card_number column
  INSERT INTO public.virtual_cards (
    user_id, card_number_encrypted, pin_hash, cvv_encrypted, 
    expiry_date, daily_limit, monthly_limit, masked_card_number
  ) VALUES (
    p_user_id, v_card_number_encrypted, v_pin_hash, v_cvv_encrypted,
    v_expiry_date, p_daily_limit, p_monthly_limit, v_card_number
  ) RETURNING id INTO v_card_id;
  
  -- Log card issuance transaction
  INSERT INTO public.virtual_card_transactions (
    card_id, user_id, transaction_type, description
  ) VALUES (
    v_card_id, p_user_id, 'activation', 'Virtual card issued and activated'
  );
  
  -- Log card creation
  INSERT INTO public.card_access_logs (card_id, user_id, access_type)
  VALUES (v_card_id, p_user_id, 'view_details');
  
  RETURN json_build_object(
    'success', true,
    'card_id', v_card_id,
    'card_number', v_card_number,
    'cvv', v_cvv,
    'expiry_date', v_expiry_date,
    'masked_card_number', v_card_number,
    'status', 'active',
    'daily_limit', p_daily_limit,
    'monthly_limit', p_monthly_limit
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Card issuance failed: ' || SQLERRM);
END;
$function$;