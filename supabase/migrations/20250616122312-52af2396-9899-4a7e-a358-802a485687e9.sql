
-- Create the missing sso_auth_codes table for storing authorization codes
CREATE TABLE IF NOT EXISTS public.sso_auth_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT DEFAULT 'profile email',
  state TEXT,
  user_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the missing sso_access_tokens table for storing access tokens
CREATE TABLE IF NOT EXISTS public.sso_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID,
  client_id TEXT NOT NULL,
  scope TEXT DEFAULT 'profile email',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sso_auth_codes_code ON public.sso_auth_codes(code);
CREATE INDEX IF NOT EXISTS idx_sso_auth_codes_client_id ON public.sso_auth_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_sso_access_tokens_token ON public.sso_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_sso_access_tokens_user_id ON public.sso_access_tokens(user_id);
