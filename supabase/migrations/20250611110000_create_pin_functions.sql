
-- Function to check if user has existing PIN
CREATE OR REPLACE FUNCTION public.get_user_pin_exists(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.transaction_pins 
    WHERE user_id = p_user_id
  );
END;
$$;

-- Function to set transaction PIN
CREATE OR REPLACE FUNCTION public.set_transaction_pin(p_user_id UUID, p_pin_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.transaction_pins (user_id, pin_hash)
  VALUES (p_user_id, p_pin_hash)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    pin_hash = EXCLUDED.pin_hash,
    updated_at = NOW();
END;
$$;

-- Function to update transaction PIN with verification
CREATE OR REPLACE FUNCTION public.update_transaction_pin(
  p_user_id UUID, 
  p_current_pin_hash TEXT, 
  p_new_pin_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_pin_hash TEXT;
BEGIN
  -- Get current PIN hash
  SELECT pin_hash INTO v_existing_pin_hash
  FROM public.transaction_pins
  WHERE user_id = p_user_id;
  
  -- Check if PIN exists
  IF v_existing_pin_hash IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No PIN found for user');
  END IF;
  
  -- Verify current PIN
  IF v_existing_pin_hash != p_current_pin_hash THEN
    RETURN json_build_object('success', false, 'error', 'Current PIN is incorrect');
  END IF;
  
  -- Update PIN
  UPDATE public.transaction_pins
  SET pin_hash = p_new_pin_hash, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'PIN updated successfully');
END;
$$;
