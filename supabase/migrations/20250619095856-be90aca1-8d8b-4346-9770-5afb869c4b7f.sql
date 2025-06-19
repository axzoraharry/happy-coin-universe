
-- Drop and recreate the sso_auth_codes table with the correct structure
DROP TABLE IF EXISTS public.sso_auth_codes CASCADE;

CREATE TABLE public.sso_auth_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT DEFAULT 'profile email',
  state TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_sso_auth_codes_code ON public.sso_auth_codes(code);
CREATE INDEX idx_sso_auth_codes_expires_at ON public.sso_auth_codes(expires_at);

-- Enable RLS
ALTER TABLE public.sso_auth_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the service role to manage auth codes
CREATE POLICY "Service role can manage auth codes" ON public.sso_auth_codes
FOR ALL USING (auth.role() = 'service_role');

-- Also ensure sso_access_tokens table has the correct structure
DROP TABLE IF EXISTS public.sso_access_tokens CASCADE;

CREATE TABLE public.sso_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  scope TEXT DEFAULT 'profile email',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_sso_access_tokens_token ON public.sso_access_tokens(token);
CREATE INDEX idx_sso_access_tokens_expires_at ON public.sso_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.sso_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the service role to manage access tokens
CREATE POLICY "Service role can manage access tokens" ON public.sso_access_tokens
FOR ALL USING (auth.role() = 'service_role');
