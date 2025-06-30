
-- Add masked card number field and security audit logging
ALTER TABLE public.virtual_cards 
ADD COLUMN masked_card_number TEXT;

-- Update existing cards to have masked card numbers
UPDATE public.virtual_cards 
SET masked_card_number = '4000 **** **** ' || RIGHT(id::TEXT, 4)
WHERE masked_card_number IS NULL;

-- Make masked_card_number not null after populating existing records
ALTER TABLE public.virtual_cards 
ALTER COLUMN masked_card_number SET NOT NULL;

-- Create card access audit log table
CREATE TABLE public.card_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.virtual_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view_details', 'copy_number', 'copy_cvv', 'status_change', 'delete')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on card access logs
ALTER TABLE public.card_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy for card access logs - users can only see their own logs
CREATE POLICY "Users can view their own card access logs" 
  ON public.card_access_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create secure function to temporarily decrypt card details
CREATE OR REPLACE FUNCTION public.get_card_secure_details(
  p_card_id UUID,
  p_user_pin TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_record RECORD;
  v_user_id UUID;
  v_pin_valid BOOLEAN := false;
  v_card_number TEXT;
  v_cvv TEXT;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Get card record with security checks
  SELECT * INTO v_card_record
  FROM public.virtual_cards
  WHERE id = p_card_id AND user_id = v_user_id AND status != 'deleted';
  
  IF NOT FOUND THEN
    -- Log failed access attempt
    INSERT INTO public.card_access_logs (card_id, user_id, access_type, ip_address, user_agent, success)
    VALUES (p_card_id, v_user_id, 'view_details', p_ip_address, p_user_agent, false);
    
    RETURN json_build_object('success', false, 'error', 'Card not found or access denied');
  END IF;
  
  -- Verify PIN if provided
  IF p_user_pin IS NOT NULL THEN
    SELECT public.verify_transaction_pin(v_user_id, p_user_pin) INTO v_pin_valid;
    
    IF NOT v_pin_valid THEN
      -- Log failed PIN verification
      INSERT INTO public.card_access_logs (card_id, user_id, access_type, ip_address, user_agent, success)
      VALUES (p_card_id, v_user_id, 'view_details', p_ip_address, p_user_agent, false);
      
      RETURN json_build_object('success', false, 'error', 'Invalid PIN');
    END IF;
  ELSE
    -- PIN is required for viewing secure details
    RETURN json_build_object('success', false, 'error', 'PIN verification required', 'pin_required', true);
  END IF;
  
  -- Decrypt card details (in production, these would be properly decrypted)
  -- For demo purposes, we'll generate consistent mock data based on card ID
  v_card_number := '4000 ' || LPAD((ABS(HASHTEXT(p_card_id::TEXT)) % 10000)::TEXT, 4, '0') || ' ' || 
                   LPAD((ABS(HASHTEXT(p_card_id::TEXT || 'middle')) % 10000)::TEXT, 4, '0') || ' ' ||
                   LPAD((ABS(HASHTEXT(p_card_id::TEXT || 'end')) % 10000)::TEXT, 4, '0');
  v_cvv := LPAD((ABS(HASHTEXT(p_card_id::TEXT || 'cvv')) % 1000)::TEXT, 3, '0');
  
  -- Log successful access
  INSERT INTO public.card_access_logs (card_id, user_id, access_type, ip_address, user_agent, success)
  VALUES (p_card_id, v_user_id, 'view_details', p_ip_address, p_user_agent, true);
  
  RETURN json_build_object(
    'success', true,
    'card_number', v_card_number,
    'cvv', v_cvv,
    'cardholder_name', 'AXZORA USER',
    'expires_at', now() + interval '30 seconds'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.card_access_logs (card_id, user_id, access_type, ip_address, user_agent, success)
    VALUES (p_card_id, v_user_id, 'view_details', p_ip_address, p_user_agent, false);
    
    RETURN json_build_object('success', false, 'error', 'Failed to retrieve card details: ' || SQLERRM);
END;
$$;

-- Create function to log card actions with audit trail
CREATE OR REPLACE FUNCTION public.log_card_action(
  p_card_id UUID,
  p_action_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  INSERT INTO public.card_access_logs (card_id, user_id, access_type, ip_address, user_agent)
  VALUES (p_card_id, v_user_id, p_action_type, p_ip_address, p_user_agent);
  
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Update the issue_virtual_card function to include masked card number
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
  
  -- Create masked version for display
  v_masked_card_number := SUBSTRING(v_card_number, 1, 4) || ' **** **** ' || RIGHT(v_card_number, 4);
  
  -- Hash PIN and encrypt sensitive data with individual salts
  v_pin_hash := crypt(p_pin, gen_salt('bf', v_salt_rounds));
  v_card_number_encrypted := crypt(v_card_number, gen_salt('bf', v_salt_rounds));
  v_cvv_encrypted := crypt(v_cvv, gen_salt('bf', v_salt_rounds));
  
  -- Insert new card
  INSERT INTO public.virtual_cards (
    user_id, card_number_encrypted, pin_hash, cvv_encrypted, 
    expiry_date, daily_limit, monthly_limit, masked_card_number
  ) VALUES (
    p_user_id, v_card_number_encrypted, v_pin_hash, v_cvv_encrypted,
    v_expiry_date, p_daily_limit, p_monthly_limit, v_masked_card_number
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
