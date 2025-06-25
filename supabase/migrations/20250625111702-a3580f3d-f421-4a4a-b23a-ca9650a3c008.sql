
-- Enable the pgcrypto extension for crypt functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the verify_transaction_pin function to use the correct extension reference
CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Use crypt to verify PIN (proper bcrypt hashing)
  RETURN crypt(p_pin, v_stored_hash) = v_stored_hash;
END;
$$;

-- Update the set_secure_transaction_pin function to use the correct extension reference
CREATE OR REPLACE FUNCTION public.set_secure_transaction_pin(p_user_id uuid, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pin_hash TEXT;
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Generate secure hash using bcrypt
  v_pin_hash := crypt(p_pin, gen_salt('bf', 12));
  
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

-- Update the reset_transaction_pin_with_password function to use the correct extension reference
CREATE OR REPLACE FUNCTION public.reset_transaction_pin_with_password(
  p_user_id UUID, 
  p_current_password TEXT,
  p_new_pin TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_exists BOOLEAN := FALSE;
  v_pin_hash TEXT;
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_new_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Check if user exists (we can't verify password directly in database function)
  -- This function should be called only after password verification on the client side
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Generate secure hash using bcrypt
  v_pin_hash := crypt(p_new_pin, gen_salt('bf', 12));
  
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
