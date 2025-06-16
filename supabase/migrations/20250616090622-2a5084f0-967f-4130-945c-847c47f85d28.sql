
-- Create API keys table for external applications
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  webhook_url TEXT,
  allowed_domains TEXT[]
);

-- Create payment requests table for tracking external payment requests
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys NOT NULL,
  external_order_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  callback_url TEXT,
  metadata JSONB,
  transaction_id UUID REFERENCES public.transactions
);

-- Create webhook logs table for tracking webhook deliveries
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys NOT NULL,
  payment_request_id UUID REFERENCES public.payment_requests,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Add RLS policies for API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own API keys" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own API keys" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own API keys" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Add RLS policies for payment requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment requests" 
  ON public.payment_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Add RLS policies for webhook logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "API key owners can view webhook logs" 
  ON public.webhook_logs 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.api_keys WHERE id = webhook_logs.api_key_id
    )
  );

-- Create function to process external payments
CREATE OR REPLACE FUNCTION public.process_external_payment(
  p_api_key TEXT,
  p_external_order_id TEXT,
  p_user_email TEXT,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'External payment',
  p_callback_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key_record RECORD;
  v_user_id UUID;
  v_payment_request_id UUID;
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_transaction_id UUID;
  v_reference_id TEXT;
BEGIN
  -- Validate API key
  SELECT ak.*, p.id as profile_user_id INTO v_api_key_record
  FROM public.api_keys ak
  JOIN public.profiles p ON ak.created_by = p.id
  WHERE ak.api_key = p_api_key AND ak.is_active = true;
  
  IF v_api_key_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid API key');
  END IF;
  
  -- Find user by email
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = p_user_email AND is_active = true;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get user's wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = v_user_id AND is_active = true;
  
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User wallet not found');
  END IF;
  
  -- Check if user has sufficient balance
  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Create payment request
  INSERT INTO public.payment_requests (
    api_key_id,
    external_order_id,
    user_id,
    amount,
    description,
    callback_url,
    metadata,
    status
  ) VALUES (
    v_api_key_record.id,
    p_external_order_id,
    v_user_id,
    p_amount,
    p_description,
    p_callback_url,
    p_metadata,
    'processing'
  ) RETURNING id INTO v_payment_request_id;
  
  -- Generate reference ID
  v_reference_id := 'EXT-' || extract(epoch from now())::bigint || '-' || p_external_order_id;
  
  -- Deduct amount from wallet
  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (
    wallet_id,
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    status
  ) VALUES (
    v_wallet_id,
    v_user_id,
    'external_payment',
    p_amount,
    p_description || ' (Order: ' || p_external_order_id || ')',
    v_reference_id,
    'completed'
  ) RETURNING id INTO v_transaction_id;
  
  -- Update payment request with transaction ID and mark as completed
  UPDATE public.payment_requests
  SET transaction_id = v_transaction_id,
      status = 'completed',
      updated_at = NOW()
  WHERE id = v_payment_request_id;
  
  -- Update API key last used timestamp
  UPDATE public.api_keys
  SET last_used_at = NOW()
  WHERE id = v_api_key_record.id;
  
  -- Create notification for user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_user_id,
    'External Payment',
    'Payment of ' || p_amount || ' HC made to ' || v_api_key_record.application_name,
    'transaction'
  );
  
  RETURN json_build_object(
    'success', true,
    'payment_request_id', v_payment_request_id,
    'transaction_id', v_transaction_id,
    'reference_id', v_reference_id,
    'new_balance', v_balance - p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to generate API key pairs
CREATE OR REPLACE FUNCTION public.generate_api_keys(
  p_user_id UUID,
  p_application_name TEXT,
  p_webhook_url TEXT DEFAULT NULL,
  p_allowed_domains TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT;
  v_secret_key TEXT;
  v_api_key_id UUID;
BEGIN
  -- Generate random API key and secret
  v_api_key := 'ak_' || encode(gen_random_bytes(24), 'base64');
  v_secret_key := 'sk_' || encode(gen_random_bytes(32), 'base64');
  
  -- Remove any problematic characters
  v_api_key := replace(replace(v_api_key, '/', '_'), '+', '-');
  v_secret_key := replace(replace(v_secret_key, '/', '_'), '+', '-');
  
  -- Insert API key record
  INSERT INTO public.api_keys (
    application_name,
    api_key,
    secret_key,
    created_by,
    webhook_url,
    allowed_domains
  ) VALUES (
    p_application_name,
    v_api_key,
    v_secret_key,
    p_user_id,
    p_webhook_url,
    p_allowed_domains
  ) RETURNING id INTO v_api_key_id;
  
  RETURN json_build_object(
    'success', true,
    'api_key_id', v_api_key_id,
    'api_key', v_api_key,
    'secret_key', v_secret_key,
    'application_name', p_application_name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
