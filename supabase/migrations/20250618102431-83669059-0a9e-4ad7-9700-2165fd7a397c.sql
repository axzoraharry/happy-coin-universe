
-- First, let's check existing policies and only create what's missing
-- Phase 1: Drop and recreate wallet policies with proper security

-- Fix overly permissive wallet access policy
DROP POLICY IF EXISTS "Users can view any wallet for transfers" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view recipient wallet for transfers" ON public.wallets;

-- Create more secure wallet policies
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view recipient wallet for transfers" ON public.wallets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.user_id = auth.uid() 
      AND t.recipient_id = wallets.user_id
      AND t.created_at > now() - interval '5 minutes'
    )
  );

-- Enable RLS on tables that don't have it yet
DO $$
BEGIN
  -- Only enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_requests' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'webhook_logs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sso_auth_codes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.sso_auth_codes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sso_access_tokens' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.sso_access_tokens ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;

-- API Keys policies
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = created_by);

-- Payment Requests policies
DROP POLICY IF EXISTS "Users can view their payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "API key owners can view payment requests" ON public.payment_requests;

CREATE POLICY "Users can view their payment requests" ON public.payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "API key owners can view payment requests" ON public.payment_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT created_by FROM public.api_keys WHERE id = payment_requests.api_key_id
    )
  );

-- Webhook Logs policies
DROP POLICY IF EXISTS "API key owners can view webhook logs" ON public.webhook_logs;

CREATE POLICY "API key owners can view webhook logs" ON public.webhook_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT created_by FROM public.api_keys WHERE id = webhook_logs.api_key_id
    )
  );

-- SSO policies (service only)
DROP POLICY IF EXISTS "Service access only for SSO auth codes" ON public.sso_auth_codes;
DROP POLICY IF EXISTS "Service access only for SSO access tokens" ON public.sso_access_tokens;

CREATE POLICY "Service access only for SSO auth codes" ON public.sso_auth_codes
  FOR ALL USING (false);

CREATE POLICY "Service access only for SSO access tokens" ON public.sso_access_tokens
  FOR ALL USING (false);

-- Phase 2: Input Validation Functions
CREATE OR REPLACE FUNCTION public.validate_api_key_format(p_api_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- API keys should start with 'ak_' and be at least 32 characters
  RETURN p_api_key ~ '^ak_[A-Za-z0-9_-]{24,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_redirect_uri(p_uri text, p_allowed_domains text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic URI validation
  IF p_uri !~ '^https?://' THEN
    RETURN false;
  END IF;
  
  -- If no allowed domains specified, allow any HTTPS
  IF p_allowed_domains IS NULL OR array_length(p_allowed_domains, 1) IS NULL THEN
    RETURN p_uri ~ '^https://';
  END IF;
  
  -- Check against allowed domains
  RETURN EXISTS (
    SELECT 1 FROM unnest(p_allowed_domains) AS domain
    WHERE p_uri LIKE domain || '%'
  );
END;
$$;

-- Phase 3: Enhanced Transfer Security Function
CREATE OR REPLACE FUNCTION public.process_secure_wallet_transfer_v2(
  sender_id uuid,
  recipient_id uuid,
  transfer_amount numeric,
  transfer_description text DEFAULT 'Transfer',
  sender_pin text DEFAULT NULL
)
RETURNS json
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
  daily_transfer_limit DECIMAL := 1000.00;
  daily_transferred DECIMAL;
BEGIN
  -- Validate input parameters
  IF transfer_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transfer amount');
  END IF;
  
  IF transfer_amount > 10000 THEN
    RETURN json_build_object('success', false, 'error', 'Transfer amount exceeds maximum limit');
  END IF;
  
  IF sender_id = recipient_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;
  
  -- Check daily transfer limit
  SELECT COALESCE(SUM(amount), 0) INTO daily_transferred
  FROM public.transactions
  WHERE user_id = sender_id 
  AND transaction_type = 'transfer_out'
  AND created_at >= CURRENT_DATE;
  
  IF daily_transferred + transfer_amount > daily_transfer_limit THEN
    RETURN json_build_object('success', false, 'error', 'Daily transfer limit exceeded');
  END IF;
  
  -- Verify PIN if provided
  IF sender_pin IS NOT NULL THEN
    SELECT public.verify_transaction_pin(sender_id, sender_pin) INTO pin_verified;
    IF NOT pin_verified THEN
      RETURN json_build_object('success', false, 'error', 'Invalid PIN');
    END IF;
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
  
  -- Create transaction records
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
    'pin_verified', pin_verified,
    'daily_limit_remaining', daily_transfer_limit - (daily_transferred + transfer_amount)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Phase 4: Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Enable RLS on rate limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits policy (system only)
DROP POLICY IF EXISTS "System only access for rate limits" ON public.rate_limits;
CREATE POLICY "System only access for rate limits" ON public.rate_limits
  FOR ALL USING (false);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, endpoint, window_start);

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;
