
-- Fix the pgcrypto function access issue by updating functions with explicit schema references
-- and proper search path settings

-- Update the verify_transaction_pin function with explicit schema references
CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  -- Get stored PIN hash
  SELECT pin_hash INTO v_stored_hash
  FROM public.transaction_pins
  WHERE user_id = p_user_id;
  
  IF v_stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Use explicit schema reference for crypt function
  RETURN public.crypt(p_pin, v_stored_hash) = v_stored_hash;
END;
$$;

-- Update the set_secure_transaction_pin function with explicit schema references
CREATE OR REPLACE FUNCTION public.set_secure_transaction_pin(p_user_id uuid, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pin_hash TEXT;
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Generate secure hash using explicit schema references
  v_pin_hash := public.crypt(p_pin, public.gen_salt('bf', 12));
  
  -- Insert or update PIN
  INSERT INTO public.transaction_pins (user_id, pin_hash)
  VALUES (p_user_id, v_pin_hash)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    pin_hash = EXCLUDED.pin_hash,
    updated_at = NOW();
    
  RETURN json_build_object('success', true, 'message', 'PIN set successfully');
END;
$$;

-- Update the reset_transaction_pin_with_password function with explicit schema references
CREATE OR REPLACE FUNCTION public.reset_transaction_pin_with_password(
  p_user_id UUID, 
  p_current_password TEXT,
  p_new_pin TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_exists BOOLEAN := FALSE;
  v_pin_hash TEXT;
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_new_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Generate secure hash using explicit schema references
  v_pin_hash := public.crypt(p_new_pin, public.gen_salt('bf', 12));
  
  -- Reset PIN (delete old one and insert new one)
  DELETE FROM public.transaction_pins WHERE user_id = p_user_id;
  
  INSERT INTO public.transaction_pins (user_id, pin_hash)
  VALUES (p_user_id, v_pin_hash);
    
  RETURN json_build_object('success', true, 'message', 'PIN reset successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the process_external_payment_secure function with explicit schema references
CREATE OR REPLACE FUNCTION public.process_external_payment_secure(
  p_api_key text, 
  p_external_order_id text, 
  p_user_email text, 
  p_amount numeric, 
  p_description text DEFAULT NULL::text, 
  p_callback_url text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT NULL::jsonb, 
  p_user_pin text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_api_key_record RECORD;
  v_user_record RECORD;
  v_merchant_record RECORD;
  v_wallet_record RECORD;
  v_merchant_wallet_record RECORD;
  v_payment_request_id UUID;
  v_transaction_id UUID;
  v_merchant_transaction_id UUID;
  v_reference_id TEXT;
  v_new_balance NUMERIC;
  v_new_merchant_balance NUMERIC;
  v_pin_hash TEXT;
  v_existing_pin_hash TEXT;
  v_error_detail TEXT;
BEGIN
  -- Validate API key
  SELECT * INTO v_api_key_record
  FROM public.api_keys
  WHERE api_key = p_api_key AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid API key');
  END IF;
  
  -- Check for duplicate order
  IF EXISTS (
    SELECT 1 FROM public.payment_requests 
    WHERE external_order_id = p_external_order_id 
    AND api_key_id = v_api_key_record.id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Order ID already processed');
  END IF;
  
  -- Find user by email
  SELECT id, email INTO v_user_record
  FROM public.profiles
  WHERE email = p_user_email AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get merchant (API key owner) details
  SELECT id, email INTO v_merchant_record
  FROM public.profiles
  WHERE id = v_api_key_record.created_by AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Merchant not found');
  END IF;
  
  -- Prevent self-payment
  IF v_user_record.id = v_merchant_record.id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot process payment to yourself');
  END IF;
  
  -- Get user's wallet
  SELECT * INTO v_wallet_record
  FROM public.wallets
  WHERE user_id = v_user_record.id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User wallet not found');
  END IF;
  
  -- Get merchant's wallet
  SELECT * INTO v_merchant_wallet_record
  FROM public.wallets
  WHERE user_id = v_merchant_record.id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Merchant wallet not found');
  END IF;
  
  -- Check if user has sufficient balance
  IF v_wallet_record.balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Verify PIN if provided
  IF p_user_pin IS NOT NULL THEN
    BEGIN
      -- Get user's PIN hash
      SELECT pin_hash INTO v_existing_pin_hash
      FROM public.transaction_pins
      WHERE user_id = v_user_record.id;
      
      IF v_existing_pin_hash IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No PIN set for user');
      END IF;
      
      -- Hash the provided PIN using explicit schema reference
      SELECT public.crypt(p_user_pin, v_existing_pin_hash) INTO v_pin_hash;
      
      IF v_pin_hash != v_existing_pin_hash THEN
        RETURN json_build_object('success', false, 'error', 'Invalid PIN');
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_error_detail := 'PIN verification failed: ' || SQLERRM;
        RETURN json_build_object('success', false, 'error', v_error_detail);
    END;
  ELSE
    -- For external payments, PIN is required if user has one set
    SELECT pin_hash INTO v_existing_pin_hash
    FROM public.transaction_pins
    WHERE user_id = v_user_record.id;
    
    IF v_existing_pin_hash IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'PIN verification required', 'pin_required', true);
    END IF;
  END IF;
  
  -- Generate IDs
  v_payment_request_id := public.gen_random_uuid();
  v_transaction_id := public.gen_random_uuid();
  v_merchant_transaction_id := public.gen_random_uuid();
  v_reference_id := 'EXT-' || extract(epoch from now())::bigint || '-' || p_external_order_id;
  
  -- Calculate new balances
  v_new_balance := v_wallet_record.balance - p_amount;
  v_new_merchant_balance := v_merchant_wallet_record.balance + p_amount;
  
  BEGIN
    -- Create debit transaction for user (payment out)
    INSERT INTO public.transactions (
      id, user_id, wallet_id, amount, transaction_type, description,
      status, reference_id, recipient_id
    ) VALUES (
      v_transaction_id, v_user_record.id, v_wallet_record.id, -p_amount,
      'transfer_out', COALESCE(p_description, 'External payment'), 'completed', v_reference_id, v_merchant_record.id
    );
    
    -- Create credit transaction for merchant (payment received)
    INSERT INTO public.transactions (
      id, user_id, wallet_id, amount, transaction_type, description,
      status, reference_id, recipient_id
    ) VALUES (
      v_merchant_transaction_id, v_merchant_record.id, v_merchant_wallet_record.id, p_amount,
      'transfer_in', 'Payment received: ' || COALESCE(p_description, 'External payment'), 'completed', v_reference_id, v_user_record.id
    );
    
    -- Create payment request record
    INSERT INTO public.payment_requests (
      id, api_key_id, user_id, external_order_id, amount, description,
      status, callback_url, metadata, transaction_id
    ) VALUES (
      v_payment_request_id, v_api_key_record.id, v_user_record.id, p_external_order_id,
      p_amount, p_description, 'completed', p_callback_url, p_metadata, v_transaction_id
    );
    
    -- Update user wallet balance (deduct)
    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = now()
    WHERE id = v_wallet_record.id;
    
    -- Update merchant wallet balance (credit)
    UPDATE public.wallets
    SET balance = v_new_merchant_balance, updated_at = now()
    WHERE id = v_merchant_wallet_record.id;
    
    -- Update API key last used
    UPDATE public.api_keys
    SET last_used_at = now()
    WHERE id = v_api_key_record.id;
    
    -- Create notifications
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES 
      (v_user_record.id, 'Payment Sent', 'Payment of ' || p_amount || ' HC sent to ' || v_merchant_record.email, 'transaction'),
      (v_merchant_record.id, 'Payment Received', 'Payment of ' || p_amount || ' HC received from ' || v_user_record.email, 'transaction');
    
  EXCEPTION
    WHEN OTHERS THEN
      v_error_detail := 'Database transaction failed: ' || SQLERRM;
      RETURN json_build_object('success', false, 'error', v_error_detail);
  END;
  
  -- Return success response
  RETURN json_build_object(
    'success', true,
    'payment_request_id', v_payment_request_id,
    'transaction_id', v_transaction_id,
    'reference_id', v_reference_id,
    'new_balance', v_new_balance,
    'merchant_id', v_merchant_record.id,
    'merchant_new_balance', v_new_merchant_balance,
    'api_key_id', v_api_key_record.id,
    'pin_verified', p_user_pin IS NOT NULL
  );
  
EXCEPTION
  WHEN OTHERS THEN
    v_error_detail := 'Unexpected error in payment processing: ' || SQLERRM;
    RETURN json_build_object('success', false, 'error', v_error_detail);
END;
$$;
