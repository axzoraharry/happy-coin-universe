
-- Create virtual cards table
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number_encrypted TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  cvv_encrypted TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'expired')),
  card_type TEXT NOT NULL DEFAULT 'virtual' CHECK (card_type IN ('virtual', 'physical')),
  issuer_name TEXT NOT NULL DEFAULT 'Happy Paisa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  activation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  daily_limit NUMERIC DEFAULT 5000.00,
  monthly_limit NUMERIC DEFAULT 50000.00,
  current_daily_spent NUMERIC DEFAULT 0.00,
  current_monthly_spent NUMERIC DEFAULT 0.00,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create virtual card transactions table
CREATE TABLE public.virtual_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.virtual_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'refund', 'validation', 'activation', 'deactivation')),
  amount NUMERIC DEFAULT 0.00,
  description TEXT,
  merchant_info JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create card validation attempts table for security
CREATE TABLE public.card_validation_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number_hash TEXT NOT NULL,
  pin_attempt_hash TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_validation_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for virtual_cards
CREATE POLICY "Users can view own virtual cards" 
  ON public.virtual_cards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual cards" 
  ON public.virtual_cards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual cards" 
  ON public.virtual_cards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for virtual_card_transactions
CREATE POLICY "Users can view own card transactions" 
  ON public.virtual_card_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card transactions" 
  ON public.virtual_card_transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for card_validation_attempts (admin access only)
CREATE POLICY "Service role can manage validation attempts" 
  ON public.card_validation_attempts 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Create function to generate card number
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  card_number TEXT;
  card_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 16-digit card number starting with 4000 (virtual card prefix)
    card_number := '4000' || lpad(floor(random() * 1000000000000)::TEXT, 12, '0');
    
    -- Check if card number already exists (encrypted comparison would be needed in production)
    SELECT EXISTS(SELECT 1 FROM public.virtual_cards WHERE card_number_encrypted = crypt(card_number, gen_salt('bf', 12))) INTO card_exists;
    
    EXIT WHEN NOT card_exists;
  END LOOP;
  
  RETURN card_number;
END;
$$;

-- Create function to generate CVV
CREATE OR REPLACE FUNCTION public.generate_cvv()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN lpad(floor(random() * 1000)::TEXT, 3, '0');
END;
$$;

-- Create function to issue new virtual card
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
BEGIN
  -- Validate PIN format (4 digits only)
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 digits');
  END IF;
  
  -- Generate card details
  v_card_number := public.generate_card_number();
  v_cvv := public.generate_cvv();
  v_expiry_date := CURRENT_DATE + INTERVAL '3 years';
  
  -- Hash PIN and encrypt sensitive data
  v_pin_hash := crypt(p_pin, gen_salt('bf', 12));
  v_card_number_encrypted := crypt(v_card_number, gen_salt('bf', 12));
  v_cvv_encrypted := crypt(v_cvv, gen_salt('bf', 12));
  
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

-- Create function to validate card and PIN
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
  v_pin_hash TEXT;
  v_validation_success BOOLEAN := false;
BEGIN
  -- Hash the provided card number for comparison
  v_card_number_hash := digest(p_card_number, 'sha256')::TEXT;
  
  -- Find card by trying to match encrypted card number
  FOR v_card_record IN 
    SELECT id, user_id, pin_hash, status, expiry_date, daily_limit, monthly_limit,
           current_daily_spent, current_monthly_spent
    FROM public.virtual_cards 
    WHERE status = 'active' AND expiry_date > CURRENT_DATE
  LOOP
    -- Check if this card matches the provided number
    IF EXISTS(
      SELECT 1 FROM public.virtual_cards 
      WHERE id = v_card_record.id 
      AND crypt(p_card_number, card_number_encrypted) = card_number_encrypted
    ) THEN
      -- Validate PIN
      IF crypt(p_pin, v_card_record.pin_hash) = v_card_record.pin_hash THEN
        v_validation_success := true;
        
        -- Update last used timestamp
        UPDATE public.virtual_cards 
        SET last_used_at = now() 
        WHERE id = v_card_record.id;
        
        -- Log successful validation
        INSERT INTO public.card_validation_attempts (
          card_number_hash, pin_attempt_hash, success, ip_address, user_agent
        ) VALUES (
          v_card_number_hash, digest(p_pin, 'sha256')::TEXT, true, p_ip_address, p_user_agent
        );
        
        RETURN json_build_object(
          'success', true,
          'card_id', v_card_record.id,
          'user_id', v_card_record.user_id,
          'status', v_card_record.status,
          'daily_limit', v_card_record.daily_limit,
          'monthly_limit', v_card_record.monthly_limit,
          'daily_spent', v_card_record.current_daily_spent,
          'monthly_spent', v_card_record.current_monthly_spent
        );
      END IF;
      EXIT; -- Found the card, no need to continue
    END IF;
  END LOOP;
  
  -- Log failed validation attempt
  INSERT INTO public.card_validation_attempts (
    card_number_hash, pin_attempt_hash, success, ip_address, user_agent
  ) VALUES (
    v_card_number_hash, digest(p_pin, 'sha256')::TEXT, false, p_ip_address, p_user_agent
  );
  
  RETURN json_build_object('success', false, 'error', 'Invalid card number or PIN');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Validation failed: ' || SQLERRM);
END;
$$;

-- Create function to update card status
CREATE OR REPLACE FUNCTION public.update_card_status(
  p_user_id UUID,
  p_card_id UUID,
  p_new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_exists BOOLEAN;
BEGIN
  -- Validate new status
  IF p_new_status NOT IN ('active', 'inactive', 'blocked', 'expired') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid status');
  END IF;
  
  -- Check if card exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM public.virtual_cards 
    WHERE id = p_card_id AND user_id = p_user_id
  ) INTO v_card_exists;
  
  IF NOT v_card_exists THEN
    RETURN json_build_object('success', false, 'error', 'Card not found');
  END IF;
  
  -- Update card status
  UPDATE public.virtual_cards 
  SET status = p_new_status, updated_at = now()
  WHERE id = p_card_id AND user_id = p_user_id;
  
  -- Log status change
  INSERT INTO public.virtual_card_transactions (
    card_id, user_id, transaction_type, description
  ) VALUES (
    p_card_id, p_user_id, 
    CASE WHEN p_new_status = 'active' THEN 'activation' ELSE 'deactivation' END,
    'Card status changed to: ' || p_new_status
  );
  
  RETURN json_build_object(
    'success', true,
    'card_id', p_card_id,
    'new_status', p_new_status,
    'updated_at', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Status update failed: ' || SQLERRM);
END;
$$;
