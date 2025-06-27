
-- Fix virtual card functions to properly handle bcrypt salts and card number validation

-- Drop and recreate the card number generation function with proper collision checking
DROP FUNCTION IF EXISTS public.generate_card_number();
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  card_number TEXT;
  card_exists BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate 16-digit card number starting with 4000 (virtual card prefix)
    card_number := '4000' || lpad(floor(random() * 1000000000000)::TEXT, 12, '0');
    
    -- Check if any card exists with this number by attempting to match it
    -- We need to check against all existing encrypted card numbers
    SELECT EXISTS(
      SELECT 1 FROM public.virtual_cards vc
      WHERE crypt(card_number, vc.card_number_encrypted) = vc.card_number_encrypted
    ) INTO card_exists;
    
    -- Increment attempt counter to prevent infinite loops
    attempt_count := attempt_count + 1;
    
    -- Exit if we found a unique number or hit max attempts
    EXIT WHEN NOT card_exists OR attempt_count >= max_attempts;
  END LOOP;
  
  -- If we couldn't generate a unique number, throw an error
  IF card_exists AND attempt_count >= max_attempts THEN
    RAISE EXCEPTION 'Unable to generate unique card number after % attempts', max_attempts;
  END IF;
  
  RETURN card_number;
END;
$$;

-- Drop and recreate the card validation function with proper matching logic
DROP FUNCTION IF EXISTS public.validate_virtual_card(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.validate_virtual_card(
  p_card_number TEXT,
  p_pin TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_record RECORD;
  v_card_number_hash TEXT;
  v_validation_success BOOLEAN := false;
  v_cards_checked INTEGER := 0;
BEGIN
  -- Hash the provided card number for logging attempts
  v_card_number_hash := digest(p_card_number, 'sha256')::TEXT;
  
  -- Log the validation attempt
  INSERT INTO public.card_validation_attempts (
    card_number_hash, pin_attempt_hash, success, ip_address, user_agent
  ) VALUES (
    v_card_number_hash, digest(p_pin, 'sha256')::TEXT, false, p_ip_address, p_user_agent
  );
  
  -- Find and validate the card
  FOR v_card_record IN 
    SELECT id, user_id, pin_hash, status, expiry_date, daily_limit, monthly_limit,
           current_daily_spent, current_monthly_spent, card_number_encrypted
    FROM public.virtual_cards 
    WHERE status = 'active' AND expiry_date > CURRENT_DATE
  LOOP
    v_cards_checked := v_cards_checked + 1;
    
    -- Check if this card matches the provided number using bcrypt comparison
    IF crypt(p_card_number, v_card_record.card_number_encrypted) = v_card_record.card_number_encrypted THEN
      -- Card number matches, now validate PIN
      IF crypt(p_pin, v_card_record.pin_hash) = v_card_record.pin_hash THEN
        v_validation_success := true;
        
        -- Update last used timestamp
        UPDATE public.virtual_cards 
        SET last_used_at = now() 
        WHERE id = v_card_record.id;
        
        -- Update the validation attempt record to mark as successful
        UPDATE public.card_validation_attempts
        SET success = true
        WHERE card_number_hash = v_card_number_hash
        AND created_at = (
          SELECT MAX(created_at) 
          FROM public.card_validation_attempts 
          WHERE card_number_hash = v_card_number_hash
        );
        
        RETURN json_build_object(
          'success', true,
          'card_id', v_card_record.id,
          'user_id', v_card_record.user_id,
          'status', v_card_record.status,
          'daily_limit', v_card_record.daily_limit,
          'monthly_limit', v_card_record.monthly_limit,
          'daily_spent', v_card_record.current_daily_spent,
          'monthly_spent', v_card_record.current_monthly_spent,
          'cards_checked', v_cards_checked
        );
      ELSE
        -- Card number matched but PIN is wrong
        RETURN json_build_object(
          'success', false, 
          'error', 'Invalid PIN',
          'cards_checked', v_cards_checked
        );
      END IF;
    END IF;
  END LOOP;
  
  -- No matching card found
  RETURN json_build_object(
    'success', false, 
    'error', 'Invalid card number',
    'cards_checked', v_cards_checked
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Validation failed: ' || SQLERRM,
      'cards_checked', v_cards_checked
    );
END;
$$;

-- Update the card issuance function with better error handling and logging
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
  
  -- Hash PIN and encrypt sensitive data with consistent salt generation
  v_pin_hash := crypt(p_pin, gen_salt('bf', v_salt_rounds));
  v_card_number_encrypted := crypt(v_card_number, gen_salt('bf', v_salt_rounds));
  v_cvv_encrypted := crypt(v_cvv, gen_salt('bf', v_salt_rounds));
  
  -- Insert new card
  INSERT INTO public.virtual_cards (
    user_id, card_number_encrypted, pin_hash, cvv_encrypted, 
    expiry_date, daily_limit, monthly_limit
  ) VALUES (
    p_user_id, v_card_number_encrypted, v_pin_hash, v_cvv_encrypted,
    v_expiry_date, p_daily_limit, p_monthly_limit
  ) RETURNING id INTO v_card_id;
  
  -- Log card issuance transaction
  INSERT INTO public.virtual_card_transactions (
    card_id, user_id, transaction_type, description
  ) VALUES (
    v_card_id, p_user_id, 'activation', 'Virtual card issued and activated'
  );
  
  RETURN json_build_object(
    'success', true,
    'card_id', v_card_id,
    'card_number', v_card_number,
    'cvv', v_cvv,
    'expiry_date', v_expiry_date,
    'status', 'active',
    'daily_limit', p_daily_limit,
    'monthly_limit', p_monthly_limit
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Card issuance failed: ' || SQLERRM);
END;
$$;

-- Add a function to check database integrity for virtual cards
CREATE OR REPLACE FUNCTION public.check_virtual_card_integrity()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_cards INTEGER;
  v_active_cards INTEGER;
  v_expired_cards INTEGER;
  v_validation_attempts_today INTEGER;
  v_successful_validations_today INTEGER;
BEGIN
  -- Count total cards
  SELECT COUNT(*) INTO v_total_cards FROM public.virtual_cards;
  
  -- Count active cards
  SELECT COUNT(*) INTO v_active_cards 
  FROM public.virtual_cards 
  WHERE status = 'active' AND expiry_date > CURRENT_DATE;
  
  -- Count expired cards
  SELECT COUNT(*) INTO v_expired_cards 
  FROM public.virtual_cards 
  WHERE expiry_date <= CURRENT_DATE;
  
  -- Count validation attempts today
  SELECT COUNT(*) INTO v_validation_attempts_today 
  FROM public.card_validation_attempts 
  WHERE created_at >= CURRENT_DATE;
  
  -- Count successful validations today
  SELECT COUNT(*) INTO v_successful_validations_today 
  FROM public.card_validation_attempts 
  WHERE created_at >= CURRENT_DATE AND success = true;
  
  RETURN json_build_object(
    'total_cards', v_total_cards,
    'active_cards', v_active_cards,
    'expired_cards', v_expired_cards,
    'validation_attempts_today', v_validation_attempts_today,
    'successful_validations_today', v_successful_validations_today,
    'validation_success_rate', 
      CASE 
        WHEN v_validation_attempts_today > 0 
        THEN ROUND((v_successful_validations_today::NUMERIC / v_validation_attempts_today::NUMERIC) * 100, 2)
        ELSE 0 
      END
  );
END;
$$;
