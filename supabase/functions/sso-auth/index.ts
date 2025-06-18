
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
    console.log('URL params:', Object.fromEntries(url.searchParams.entries()));

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

    console.log('SSO Authorize request:', { clientId, redirectUri, scope, state });

    if (!clientId || !redirectUri) {
      console.error('Missing required parameters:', { clientId: !!clientId, redirectUri: !!redirectUri });
      
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Request - HappyCoins SSO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; margin: 0; }
            .error-container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error-title { color: #dc3545; margin-bottom: 20px; font-size: 24px; }
            .error-message { margin-bottom: 30px; color: #666; line-height: 1.5; }
            .retry-button { 
              background: #007bff; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; display: inline-block;
              font-weight: bold; border: none; cursor: pointer;
            }
            .retry-button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1 class="error-title">Invalid Request</h1>
            <p class="error-message">Missing required parameters: client_id and redirect_uri</p>
            <button onclick="window.close()" class="retry-button">Close Window</button>
          </div>
        </body>
        </html>
      `;
      
      return new Response(errorHtml, {
        status: 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Verify API key/client_id exists and is active
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', clientId)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKey) {
      console.error('Invalid client_id:', clientId, apiKeyError);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Client - HappyCoins SSO</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; margin: 0; }
            .error-container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error-title { color: #dc3545; margin-bottom: 20px; font-size: 24px; }
            .error-message { margin-bottom: 30px; color: #666; line-height: 1.5; }
            .retry-button { 
              background: #007bff; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; display: inline-block;
              font-weight: bold; border: none; cursor: pointer;
            }
            .retry-button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1 class="error-title">Invalid Application</h1>
            <p class="error-message">The application you're trying to connect to is not authorized or has been disabled. Please contact the application provider.</p>
            <button onclick="window.close()" class="retry-button">Close Window</button>
          </div>
        </body>
        </html>
      `;
      
      return new Response(errorHtml, {
        status: 401,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Check if redirect_uri is allowed
    if (apiKey.allowed_domains && apiKey.allowed_domains.length > 0) {
      const isAllowed = apiKey.allowed_domains.some((domain: string) => 
        redirectUri.startsWith(domain));
      
      if (!isAllowed) {
        console.error('Invalid redirect_uri:', redirectUri, 'Allowed domains:', apiKey.allowed_domains);
        
        const errorHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Redirect - HappyCoins SSO</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; margin: 0; }
              .error-container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error-title { color: #dc3545; margin-bottom: 20px; font-size: 24px; }
              .error-message { margin-bottom: 30px; color: #666; line-height: 1.5; }
              .retry-button { 
                background: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 5px; display: inline-block;
                font-weight: bold; border: none; cursor: pointer;
              }
              .retry-button:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <div class="error-container">
              <h1 class="error-title">Invalid Redirect URL</h1>
              <p class="error-message">The redirect URL is not authorized for this application. Please contact the application provider.</p>
              <button onclick="window.close()" class="retry-button">Close Window</button>
            </div>
          </body>
          </html>
        `;
        
        return new Response(errorHtml, {
          status: 400,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    }

    // Create an authorization page that provides a proper login interface
    const baseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const authorizationHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authorize with HappyCoins</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 20px; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          .auth-container { 
            max-width: 400px; 
            width: 100%;
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            box-sizing: border-box;
          }
          .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 10px;
          }
          .subtitle { 
            color: #666; 
            margin-bottom: 30px; 
            font-size: 16px;
          }
          .app-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .app-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .permissions {
            color: #666;
            font-size: 14px;
          }
          .auth-button { 
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            display: inline-block;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
            border: none;
            cursor: pointer;
            width: 100%;
            box-sizing: border-box;
          }
          .auth-button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          .cancel-button {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 20px;
            display: inline-block;
            margin-top: 15px;
            font-size: 14px;
            border: none;
            cursor: pointer;
          }
          .cancel-button:hover {
            background: #5a6268;
          }
          .security-note {
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="auth-container">
          <div class="logo">🪙 HappyCoins</div>
          <div class="subtitle">Secure Digital Wallet</div>
          
          <div class="app-info">
            <div class="app-name">${apiKey.application_name || 'Third-party Application'}</div>
            <div class="permissions">Requesting access to: ${scope}</div>
          </div>
          
          <p style="color: #333; margin-bottom: 30px;">
            "${apiKey.application_name || 'This application'}" wants to connect to your HappyCoins account.
          </p>
          
          <button class="auth-button" onclick="authorizeApp()">
            Continue to HappyCoins Login
          </button>
          
          <button class="cancel-button" onclick="cancelAuth()">
            Cancel
          </button>
          
          <div class="security-note">
            You will be redirected to HappyCoins to sign in. After signing in, you'll be brought back to authorize this application.
          </div>
        </div>
        
        <script>
          function authorizeApp() {
            // Store authorization request details in sessionStorage
            sessionStorage.setItem('sso_auth_request', JSON.stringify({
              client_id: '${clientId}',
              redirect_uri: '${redirectUri}',
              scope: '${scope}',
              state: '${state || ''}',
              app_name: '${apiKey.application_name || 'Application'}'
            }));
            
            // Redirect to the actual HappyCoins application for authentication
            window.location.href = '${baseUrl}/?sso_auth=true&return_to=' + encodeURIComponent(window.location.href);
          }
          
          function cancelAuth() {
            const redirectUrl = '${redirectUri}?error=access_denied' + (${state ? `'&state=${state}'` : `''`});
            
            // Send message to parent window and close popup
            if (window.opener) {
              window.opener.postMessage({
                type: 'HAPPYCOINS_AUTH_ERROR',
                error: 'User cancelled authorization'
              }, '*');
              window.close();
            } else {
              window.location.href = redirectUrl;
            }
          }
          
          // Handle potential communication with parent window
          window.addEventListener('load', function() {
            console.log('Authorization page loaded successfully');
          });
        </script>
      </body>
      </html>
    `;

    return new Response(authorizationHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    console.error('Error in handleAuthorize:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - HappyCoins SSO</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; margin: 0; }
          .error-container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error-title { color: #dc3545; margin-bottom: 20px; font-size: 24px; }
          .error-message { margin-bottom: 30px; color: #666; line-height: 1.5; }
          .retry-button { 
            background: #007bff; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 5px; display: inline-block;
            font-weight: bold; border: none; cursor: pointer;
          }
          .retry-button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1 class="error-title">Authorization Error</h1>
          <p class="error-message">An error occurred during authorization. Please try again.</p>
          <button onclick="window.close()" class="retry-button">Close Window</button>
        </div>
      </body>
      </html>
    `;
    
    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
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
