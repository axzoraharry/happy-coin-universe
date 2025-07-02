
-- Update the issue_virtual_card function to use deterministic card number generation
CREATE OR REPLACE FUNCTION public.issue_virtual_card(
  p_user_id UUID,
  p_pin TEXT,
  p_daily_limit NUMERIC DEFAULT 5000.00,
  p_monthly_limit NUMERIC DEFAULT 50000.00
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_id UUID;
  v_card_number TEXT;
  v_cvv TEXT;
  v_expiry_date DATE;
  v_pin_hash TEXT;
  v_card_number_encrypted TEXT;
  v_cvv_encrypted TEXT;
  v_masked_card_number TEXT;
  v_salt_rounds INTEGER := 12;
  v_clean_id TEXT;
  v_hash_sum INTEGER;
  v_seed BIGINT;
  v_card_suffix TEXT;
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Generate card ID first
  v_card_id := gen_random_uuid();
  
  -- Generate card number using the same algorithm as frontend CardNumberUtils
  v_clean_id := REPLACE(v_card_id::TEXT, '-', '');
  v_hash_sum := 0;
  
  -- Calculate hash sum of characters
  FOR i IN 1..LENGTH(v_clean_id) LOOP
    v_hash_sum := v_hash_sum + ASCII(SUBSTRING(v_clean_id, i, 1));
  END LOOP;
  
  -- Generate seed and card number (matching frontend algorithm)
  v_seed := v_hash_sum % 1000000000000; -- 12 digits max
  v_card_suffix := LPAD(v_seed::TEXT, 12, '0');
  v_card_number := '4000' || v_card_suffix;
  
  -- Generate CVV using same algorithm as frontend
  v_hash_sum := 0;
  FOR i IN 1..LENGTH(v_card_id::TEXT) LOOP
    v_hash_sum := ((v_hash_sum << 3) - v_hash_sum) + ASCII(SUBSTRING(v_card_id::TEXT, i, 1));
    v_hash_sum := v_hash_sum & v_hash_sum; -- Simulate JavaScript bitwise AND
  END LOOP;
  v_cvv := LPAD((ABS(v_hash_sum) % 900 + 100)::TEXT, 3, '0');
  
  v_expiry_date := CURRENT_DATE + INTERVAL '3 years';
  
  -- Create masked version for display
  v_masked_card_number := SUBSTRING(v_card_number, 1, 4) || ' **** **** ' || RIGHT(v_card_number, 4);
  
  -- Hash PIN and encrypt sensitive data with individual salts
  v_pin_hash := crypt(p_pin, gen_salt('bf', v_salt_rounds));
  v_card_number_encrypted := crypt(v_card_number, gen_salt('bf', v_salt_rounds));
  v_cvv_encrypted := crypt(v_cvv, gen_salt('bf', v_salt_rounds));
  
  -- Insert new card with the generated ID
  INSERT INTO public.virtual_cards (
    id, user_id, card_number_encrypted, pin_hash, cvv_encrypted, 
    expiry_date, daily_limit, monthly_limit, masked_card_number
  ) VALUES (
    v_card_id, p_user_id, v_card_number_encrypted, v_pin_hash, v_cvv_encrypted,
    v_expiry_date, p_daily_limit, p_monthly_limit, v_masked_card_number
  );
  
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
    'masked_card_number', v_masked_card_number,
    'status', 'active',
    'daily_limit', p_daily_limit,
    'monthly_limit', p_monthly_limit
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Card issuance failed: ' || SQLERRM);
END;
$$;
