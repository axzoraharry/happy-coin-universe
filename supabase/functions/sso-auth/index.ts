import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  // Create Supabase client with service role key for database access
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    console.log(`SSO Auth: ${req.method} ${path}`);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    if (path.endsWith('/authorize')) {
      return await handleAuthorize(req, supabaseClient);
    } else if (path.endsWith('/token')) {
      return await handleToken(req, supabaseClient);
    } else if (path.endsWith('/userinfo')) {
      return await handleUserInfo(req, supabaseClient);
    } else if (path.endsWith('/callback')) {
      return await handleCallback(req, supabaseClient);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SSO Auth Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleAuthorize(req: Request, supabase: any) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const scope = url.searchParams.get('scope') || 'profile email';
    const state = url.searchParams.get('state');
    const accessTokenFromUrl = url.searchParams.get('access_token');

    console.log('SSO Authorize request:', { clientId, redirectUri, scope, state, hasUrlToken: !!accessTokenFromUrl });

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: client_id and redirect_uri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from request headers or URL parameter
    let token = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (accessTokenFromUrl) {
      token = accessTokenFromUrl;
    }

    if (!token) {
      console.error('No valid authorization token found');
      
      // Redirect to login page with return URL
      const loginUrl = `${Deno.env.get('SUPABASE_URL') || 'https://zygpupmeradizrachnqj.supabase.co'}/?return_to=${encodeURIComponent(req.url)}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': loginUrl
        }
      });
    }

    // Verify the user is authenticated by checking the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid user token:', authError);
      
      // Redirect to login page
      const loginUrl = `${Deno.env.get('SUPABASE_URL') || 'https://zygpupmeradizrachnqj.supabase.co'}/`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': loginUrl
        }
      });
    }

    console.log('Authenticated user:', user.id);

    // Verify API key/client_id exists and is active
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', clientId)
      .eq('is_active', true)
      .single();

    if (error || !apiKey) {
      console.error('Invalid client_id:', clientId, error);
      return new Response(
        JSON.stringify({ error: 'Invalid client_id' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if redirect_uri is allowed
    if (apiKey.allowed_domains && apiKey.allowed_domains.length > 0) {
      const isAllowed = apiKey.allowed_domains.some((domain: string) => 
        redirectUri.startsWith(domain));
      
      if (!isAllowed) {
        console.error('Invalid redirect_uri:', redirectUri, 'Allowed domains:', apiKey.allowed_domains);
        return new Response(
          JSON.stringify({ error: 'Invalid redirect_uri' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate authorization code
    const authCode = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store authorization code with the authenticated user ID
    const { error: insertError } = await supabase.from('sso_auth_codes').insert({
      code: authCode,
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      state: state,
      user_id: user.id, // Store the actual authenticated user ID
      expires_at: expiresAt.toISOString(),
      used: false
    });

    if (insertError) {
      console.error('Failed to store auth code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate authorization code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth code stored successfully for user:', user.id);

    // Redirect back to the application with the authorization code
    const finalRedirectUrl = new URL(redirectUri);
    finalRedirectUrl.searchParams.set('code', authCode);
    if (state) {
      finalRedirectUrl.searchParams.set('state', state);
    }

    console.log('Final redirect to:', finalRedirectUrl.toString());

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': finalRedirectUrl.toString()
      }
    });

  } catch (error) {
    console.error('Error in handleAuthorize:', error);
    return new Response(
      JSON.stringify({ error: 'Authorization failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCallback(req: Request, supabase: any) {
  const url = new URL(req.url);
  const authCode = url.searchParams.get('code');
  const redirectUri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');

  console.log('SSO Callback:', { authCode, redirectUri, state });

  if (!authCode || !redirectUri) {
    return new Response(
      'Missing required parameters',
      { status: 400, headers: corsHeaders }
    );
  }

  // This endpoint should not be used anymore since we're doing direct redirects
  // But keeping it for backward compatibility
  const finalRedirectUrl = new URL(redirectUri);
  finalRedirectUrl.searchParams.set('code', authCode);
  if (state) {
    finalRedirectUrl.searchParams.set('state', state);
  }

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': finalRedirectUrl.toString()
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

  console.log('Token request:', { code, client_id, redirect_uri });

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

  // Verify the user_id exists (should be set during authorize)
  if (!authCodeData.user_id) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization code - no user associated' }),
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

  // Store access token with the real user ID
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
    sub: profile?.id || tokenData.user_id,
    email: profile?.email || 'unknown@happycoins.com',
    name: profile?.full_name || 'HappyCoins User',
    preferred_username: profile?.full_name || 'HappyCoins User'
  };

  // Include additional fields based on scope
  if (tokenData.scope.includes('wallet')) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', profile?.id || tokenData.user_id)
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
