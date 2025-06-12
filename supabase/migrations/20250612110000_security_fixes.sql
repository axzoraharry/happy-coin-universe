
-- Security Fix 1: Implement proper PIN hashing and verification
CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN
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

-- Security Fix 2: Enhanced PIN setting function with proper hashing
CREATE OR REPLACE FUNCTION public.set_secure_transaction_pin(p_user_id UUID, p_pin TEXT)
RETURNS JSON
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

-- Security Fix 3: Enhanced transfer function with PIN verification
CREATE OR REPLACE FUNCTION public.process_secure_wallet_transfer(
  sender_id UUID,
  recipient_id UUID,
  transfer_amount DECIMAL,
  transfer_description TEXT DEFAULT 'Transfer',
  sender_pin TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_wallet_id UUID;
  recipient_wallet_id UUID;
  sender_balance DECIMAL;
  recipient_balance DECIMAL;
  reference_id TEXT;
  pin_verified BOOLEAN := FALSE;
BEGIN
  -- Verify PIN if provided
  IF sender_pin IS NOT NULL THEN
    SELECT public.verify_transaction_pin(sender_id, sender_pin) INTO pin_verified;
    IF NOT pin_verified THEN
      RETURN json_build_object('success', false, 'error', 'Invalid PIN');
    END IF;
  END IF;
  
  -- Validate transfer amount
  IF transfer_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transfer amount');
  END IF;
  
  -- Validate users are different
  IF sender_id = recipient_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;
  
  -- Generate reference ID for transaction tracking
  reference_id := 'TXN-' || extract(epoch from now())::bigint;
  
  -- Get sender's wallet with row lock
  SELECT id, balance INTO sender_wallet_id, sender_balance
  FROM public.wallets
  WHERE user_id = sender_id AND is_active = true
  FOR UPDATE;
  
  IF sender_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;
  
  -- Get recipient's wallet with row lock
  SELECT id, balance INTO recipient_wallet_id, recipient_balance
  FROM public.wallets
  WHERE user_id = recipient_id AND is_active = true
  FOR UPDATE;
  
  IF recipient_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient wallet not found');
  END IF;
  
  -- Check if sender has sufficient balance
  IF sender_balance < transfer_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Update sender's wallet balance
  UPDATE public.wallets
  SET balance = balance - transfer_amount,
      updated_at = NOW()
  WHERE id = sender_wallet_id;
  
  -- Update recipient's wallet balance
  UPDATE public.wallets
  SET balance = balance + transfer_amount,
      updated_at = NOW()
  WHERE id = recipient_wallet_id;
  
  -- Create transaction records with enhanced logging
  INSERT INTO public.transactions (
    wallet_id,
    user_id,
    transaction_type,
    amount,
    description,
    recipient_id,
    reference_id,
    status
  ) VALUES
  (
    sender_wallet_id,
    sender_id,
    'transfer_out',
    transfer_amount,
    transfer_description,
    recipient_id,
    reference_id,
    'completed'
  ),
  (
    recipient_wallet_id,
    recipient_id,
    'transfer_in',
    transfer_amount,
    'Transfer from ' || (SELECT email FROM auth.users WHERE id = sender_id),
    sender_id,
    reference_id,
    'completed'
  );
  
  RETURN json_build_object(
    'success', true,
    'sender_new_balance', sender_balance - transfer_amount,
    'recipient_new_balance', recipient_balance + transfer_amount,
    'reference_id', reference_id,
    'pin_verified', pin_verified
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Security Fix 4: Add RLS policies for better access control
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" 
  ON public.wallets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" 
  ON public.wallets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
  ON public.transactions 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert own transactions" 
  ON public.transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coins" 
  ON public.user_coins 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own coins" 
  ON public.user_coins 
  FOR UPDATE 
  USING (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);
