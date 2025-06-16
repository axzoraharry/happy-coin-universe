
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface SSORequest {
  redirect_uri: string;
  client_id: string;
  scope?: string;
  state?: string;
}

interface SSOTokenRequest {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/authorize')) {
      return await handleAuthorize(req, supabaseClient);
    } else if (path.endsWith('/token')) {
      return await handleToken(req, supabaseClient);
    } else if (path.endsWith('/userinfo')) {
      return await handleUserInfo(req, supabaseClient);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SSO Auth Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleAuthorize(req: Request, supabase: any) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const scope = url.searchParams.get('scope') || 'profile email';
  const state = url.searchParams.get('state');

  if (!clientId || !redirectUri) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify API key/client_id
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('api_key', clientId)
    .eq('is_active', true)
    .single();

  if (error || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'Invalid client_id' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if redirect_uri is allowed
  if (apiKey.allowed_domains && !apiKey.allowed_domains.some((domain: string) => 
    redirectUri.startsWith(domain))) {
    return new Response(
      JSON.stringify({ error: 'Invalid redirect_uri' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Generate authorization code
  const authCode = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store authorization code
  await supabase.from('sso_auth_codes').insert({
    code: authCode,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
    expires_at: expiresAt.toISOString()
  });

  // Redirect to HappyCoins login with auth code in callback
  const loginUrl = `https://zygpupmeradizrachnqj.supabase.co/auth/v1/authorize?provider=happycoins&redirect_to=${encodeURIComponent(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/sso-auth/callback?code=${authCode}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state || ''}`
  )}`;

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': loginUrl
    }
  });
}

async function handleToken(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body: SSOTokenRequest = await req.json();
  const { code, client_id, client_secret, redirect_uri } = body;

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify client credentials
  const { data: apiKey, error: apiError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('api_key', client_id)
    .eq('secret_key', client_secret)
    .eq('is_active', true)
    .single();

  if (apiError || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'Invalid client credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get and verify authorization code
  const { data: authCodeData, error: codeError } = await supabase
    .from('sso_auth_codes')
    .select('*')
    .eq('code', code)
    .eq('client_id', client_id)
    .eq('redirect_uri', redirect_uri)
    .eq('used', false)
    .single();

  if (codeError || !authCodeData) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization code' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if code is expired
  if (new Date(authCodeData.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: 'Authorization code expired' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Mark code as used
  await supabase
    .from('sso_auth_codes')
    .update({ used: true })
    .eq('code', code);

  // Generate access token
  const accessToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

  // Store access token
  await supabase.from('sso_access_tokens').insert({
    token: accessToken,
    user_id: authCodeData.user_id,
    client_id: client_id,
    scope: authCodeData.scope,
    expires_at: expiresAt.toISOString()
  });

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: authCodeData.scope
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleUserInfo(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const accessToken = authHeader.substring(7);

  // Verify access token
  const { data: tokenData, error } = await supabase
    .from('sso_access_tokens')
    .select('*, profiles(*)')
    .eq('token', accessToken)
    .eq('revoked', false)
    .single();

  if (error || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'Invalid access token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: 'Access token expired' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const profile = tokenData.profiles;
  const userInfo: any = {
    sub: profile.id,
    email: profile.email,
    name: profile.full_name,
    preferred_username: profile.full_name
  };

  // Include additional fields based on scope
  if (tokenData.scope.includes('wallet')) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', profile.id)
      .single();
    
    if (wallet) {
      userInfo.wallet_balance = wallet.balance;
    }
  }

  return new Response(
    JSON.stringify(userInfo),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
