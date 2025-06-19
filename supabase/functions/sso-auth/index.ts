import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Updated CORS headers with a more permissive CSP for auth checks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Security-Policy': "default-src 'self' https://zygpupmeradizrachnqj.supabase.co; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://zygpupmeradizrachnqj.supabase.co;",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

interface AuthorizeRequest {
  client_id: string;
  redirect_uri: string;
  scope?: string;
  response_type: string;
  state?: string;
}

serve(async (req) => {
  const url = new URL(req.url);
  console.log(`SSO Auth: ${req.method} ${url.pathname}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (url.pathname === '/sso-auth/authorize' && req.method === 'GET') {
      // Handle authorization request
      const params = Object.fromEntries(url.searchParams.entries());
      console.log('URL params:', params);

      const authRequest: AuthorizeRequest = {
        client_id: params.client_id || '',
        redirect_uri: params.redirect_uri || '',
        scope: params.scope || 'profile email',
        response_type: params.response_type || 'code',
        state: params.state
      };

      console.log('SSO Authorize request:', {
        clientId: authRequest.client_id,
        redirectUri: authRequest.redirect_uri,
        scope: authRequest.scope,
        state: authRequest.state
      });

      // Validate required parameters
      if (!authRequest.client_id || !authRequest.redirect_uri) {
        return new Response(
          createErrorPage('Missing required parameters: client_id and redirect_uri are required'),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        );
      }

      // Validate API key format
      if (!authRequest.client_id.startsWith('ak_')) {
        return new Response(
          createErrorPage('Invalid client_id format. API keys must start with "ak_"'),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        );
      }

      // Verify API key exists and is active
      const { data: apiKey, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('id, application_name, created_by, is_active')
        .eq('api_key', authRequest.client_id)
        .eq('is_active', true)
        .single();

      if (apiKeyError || !apiKey) {
        console.error('Invalid API key:', authRequest.client_id, 'Error:', apiKeyError?.message);
        return new Response(
          createErrorPage('Invalid or inactive API key. Please check your client_id and ensure the API key is active.'),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        );
      }

      console.log('Valid API key found:', { id: apiKey.id, application_name: apiKey.application_name });

      // Check for session in multiple ways to handle cross-tab authentication
      let user = null;
      let profile = null;
      
      // First, try to get user from Authorization header
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: headerUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && headerUser) {
          user = headerUser;
          console.log('User authenticated via header:', user.id);
        }
      }
      
      // If no user from header, check for session cookies or other auth methods
      if (!user) {
        // Try to get session from cookies (this handles cross-tab scenarios)
        const cookieHeader = req.headers.get('Cookie');
        if (cookieHeader) {
          // Parse session from cookies - this is a simplified approach
          // In a real implementation, you'd parse the actual Supabase session cookies
          console.log('Checking for session in cookies...');
        }
      }

      // If still no authenticated user, return login required page
      if (!user) {
        console.log('No authenticated user found - showing login page');
        return new Response(
          createInteractiveAuthPage(authRequest, apiKey.application_name),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        );
      }

      console.log('User authenticated:', user.id);

      // Check if user's profile is active
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_active, full_name, email')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile || !userProfile.is_active) {
        console.error('User profile not found or inactive:', user.id, profileError?.message);
        return new Response(
          createErrorPage('User account not found or deactivated. Please ensure your HappyCoins account is active.'),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        );
      }

      // Generate authorization code
      const authCode = generateAuthCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store authorization code
      const { error: storeError } = await supabase
        .from('sso_auth_codes')
        .insert({
          code: authCode,
          api_key_id: apiKey.id,
          redirect_uri: authRequest.redirect_uri,
          scope: authRequest.scope,
          state: authRequest.state,
          expires_at: expiresAt.toISOString()
        });

      if (storeError) {
        console.error('Failed to store auth code:', storeError);
        return new Response(
          createErrorPage('Failed to generate authorization code. Please try again.'),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          }
        );
      }

      // Build redirect URL with authorization code
      const redirectUrl = new URL(authRequest.redirect_uri);
      redirectUrl.searchParams.set('code', authCode);
      if (authRequest.state) {
        redirectUrl.searchParams.set('state', authRequest.state);
      }

      console.log('Authorization successful for authenticated user, redirecting to:', redirectUrl.toString());

      // Return HTML page that performs the redirect
      const html = createRedirectPage(redirectUrl.toString(), apiKey.application_name);
      
      return new Response(html, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    // Handle token exchange
    if (url.pathname === '/sso-auth/token' && req.method === 'POST') {
      const body = await req.json();
      
      const { code, client_id, redirect_uri } = body;
      
      if (!code || !client_id || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verify and consume authorization code
      const { data: authCodeData, error: codeError } = await supabase
        .from('sso_auth_codes')
        .select(`
          id,
          api_key_id,
          redirect_uri,
          scope,
          expires_at,
          used_at,
          api_keys!inner (
            id,
            created_by,
            application_name,
            api_key
          )
        `)
        .eq('code', code)
        .eq('redirect_uri', redirect_uri)
        .single();

      if (codeError || !authCodeData || authCodeData.api_keys.api_key !== client_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization code' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if code is expired or already used
      if (authCodeData.used_at || new Date(authCodeData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Authorization code expired or already used' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Mark code as used
      await supabase
        .from('sso_auth_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', authCodeData.id);

      // Generate access token
      const accessToken = generateAccessToken();
      const tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

      // Store access token
      await supabase
        .from('sso_access_tokens')
        .insert({
          token: accessToken,
          api_key_id: authCodeData.api_key_id,
          scope: authCodeData.scope,
          expires_at: tokenExpiresAt.toISOString()
        });

      // Get user profile for the response
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', authCodeData.api_keys.created_by)
        .single();

      return new Response(
        JSON.stringify({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: authCodeData.scope,
          user: profile ? {
            id: profile.id,
            name: profile.full_name,
            email: profile.email
          } : null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response('Not Found', { 
      status: 404, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('SSO Auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateAuthCode(): string {
  return 'ac_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(36))
    .join('');
}

function generateAccessToken(): string {
  return 'at_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(36))
    .join('');
}

function createInteractiveAuthPage(authRequest: AuthorizeRequest, appName: string = 'Application'): string {
  const loginUrl = 'https://happy-wallet.axzoragroup.com/';
  const currentAuthUrl = `https://zygpupmeradizrachnqj.supabase.co/functions/v1/sso-auth/authorize?` + 
    new URLSearchParams({
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      scope: authRequest.scope || 'profile email',
      response_type: authRequest.response_type,
      ...(authRequest.state ? { state: authRequest.state } : {})
    }).toString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HappyCoins SSO Authorization</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://zygpupmeradizrachnqj.supabase.co; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://zygpupmeradizrachnqj.supabase.co;">
</head>
<body>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 500px;
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .app-info {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        .app-name {
            color: #fbbf24;
            font-weight: 600;
        }
        .button {
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
            transition: background-color 0.2s;
        }
        .button:hover {
            background: #059669;
        }
        .button.secondary {
            background: #6366f1;
        }
        .button.secondary:hover {
            background: #4f46e5;
        }
        .info-text {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-top: 1rem;
        }
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .hidden { display: none; }
    </style>
    
    <div class="container">
        <div class="logo">🪙 HappyCoins</div>
        <div class="message">SSO Authorization</div>
        
        <div class="app-info">
            <strong><span class="app-name">${appName}</span></strong> is requesting access to your HappyCoins account.
        </div>
        
        <div id="auth-buttons">
            <a href="${loginUrl}" class="button" target="_blank">
                Log in to HappyCoins
            </a>
            <button onclick="checkAuth()" class="button secondary">
                I'm Already Logged In
            </button>
        </div>
        
        <div id="checking" class="hidden">
            <div class="spinner"></div>
            Checking authentication...
        </div>
        
        <div class="info-text">
            If you're already logged in to HappyCoins in another tab, click "I'm Already Logged In" to continue.
        </div>
    </div>
    
    <script>
        async function checkAuth() {
            const buttons = document.getElementById('auth-buttons');
            const checking = document.getElementById('checking');
            
            buttons.classList.add('hidden');
            checking.classList.remove('hidden');
            
            try {
                // Try to get the current session from HappyCoins
                const response = await fetch('https://zygpupmeradizrachnqj.supabase.co/auth/v1/user', {
                    credentials: 'include',
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5Z3B1cG1lcmFkaXpyYWNobnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMDkwMDMsImV4cCI6MjA2Mjg4NTAwM30.u6cJkMkw17DSmapGl3dgG7NPOh5--PPnRHr8ZWy6WXo'
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    if (userData && userData.id) {
                        // User is authenticated, redirect to auth endpoint with session
                        window.location.href = '${currentAuthUrl}';
                        return;
                    }
                }
            } catch (error) {
                console.log('Auth check failed:', error);
            }
            
            // If we get here, user is not authenticated
            buttons.classList.remove('hidden');
            checking.classList.add('hidden');
            alert('Please log in to HappyCoins first, then try again.');
        }
        
        // Auto-check authentication every few seconds
        let checkCount = 0;
        const autoCheck = setInterval(() => {
            checkCount++;
            if (checkCount > 20) { // Stop after 20 attempts (1 minute)
                clearInterval(autoCheck);
                return;
            }
            
            fetch('https://zygpupmeradizrachnqj.supabase.co/auth/v1/user', {
                credentials: 'include',
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5Z3B1cG1lcmFkaXpyYWNobnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMDkwMDMsImV4cCI6MjA2Mjg4NTAwM30.u6cJkMkw17DSmapGl3dgG7NPOh5--PPnRHr8ZWy6WXo'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Not authenticated');
            })
            .then(userData => {
                if (userData && userData.id) {
                    clearInterval(autoCheck);
                    window.location.href = '${currentAuthUrl}';
                }
            })
            .catch(() => {
                // Still not authenticated, continue checking
            });
        }, 3000); // Check every 3 seconds
    </script>
</body>
</html>`;
}

function createRedirectPage(redirectUrl: string, appName: string = 'Application'): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HappyCoins Authorization</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
</head>
<body>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .redirect-info {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-top: 1rem;
        }
        .app-name {
            color: #fbbf24;
            font-weight: 600;
        }
    </style>
    
    <div class="container">
        <div class="logo">🪙 HappyCoins</div>
        <div class="message">Authorization successful!</div>
        <div class="spinner"></div>
        <div>Redirecting you back to <span class="app-name">${appName}</span>...</div>
        <div class="redirect-info">
            If you are not redirected automatically, 
            <a href="${redirectUrl}" style="color: white; text-decoration: underline;">click here</a>
        </div>
    </div>
    
    <script>
        // Immediate redirect
        setTimeout(function() {
            window.location.href = '${redirectUrl}';
        }, 1000);
    </script>
</body>
</html>`;
}

function createErrorPage(errorMessage: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HappyCoins Authorization Error</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
</head>
<body>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        .details {
            font-size: 0.9rem;
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
    </style>
    
    <div class="container">
        <div class="logo">🪙 HappyCoins</div>
        <div class="error-icon">⚠️</div>
        <div class="message">Authorization Error</div>
        <div class="details">${errorMessage}</div>
        <div>Please check your configuration and try again.</div>
    </div>
</body>
</html>`;
}
