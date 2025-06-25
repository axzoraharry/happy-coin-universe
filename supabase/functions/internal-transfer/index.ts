
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TransferRequest {
  recipient_email: string;
  amount: number;
  description?: string;
  user_pin?: string;
}

interface TransferResponse {
  success: boolean;
  data?: {
    transaction_id: string;
    reference_id: string;
    sender_new_balance: number;
    recipient_new_balance: number;
    pin_verified: boolean;
    daily_limit_remaining: number;
  };
  error?: string;
  error_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed', error_code: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // API Key validation
    const apiKey = req.headers.get('x-api-key');
    let userId: string;

    if (apiKey) {
      // API key authentication for external services
      console.log('Authenticating with API key:', apiKey.substring(0, 8) + '...');
      
      // Validate API key format
      if (!apiKey.match(/^ak_[A-Za-z0-9_-]{24,}$/)) {
        console.error('Invalid API key format');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid API key format', error_code: 'INVALID_API_KEY_FORMAT' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('id, created_by, is_active')
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .single();

      if (apiKeyError) {
        console.error('API key lookup error:', apiKeyError);
        return new Response(
          JSON.stringify({ success: false, error: 'API key lookup failed', error_code: 'API_KEY_LOOKUP_ERROR' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!apiKeyData) {
        console.error('API key not found or inactive');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or inactive API key', error_code: 'INVALID_API_KEY' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = apiKeyData.created_by;
      console.log('API key authenticated for user:', userId);
      
      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id);

    } else {
      // JWT authentication for direct user access
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authorization required', error_code: 'AUTH_REQUIRED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Authentication failed:', authError);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication', error_code: 'INVALID_AUTH' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = user.id;
      console.log('JWT authenticated for user:', userId);
    }

    // Parse request body
    const body: TransferRequest = await req.json();
    console.log('Transfer request:', { ...body, user_pin: body.user_pin ? '[REDACTED]' : undefined });

    // Validate required fields
    if (!body.recipient_email || !body.amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: recipient_email, amount', 
          error_code: 'MISSING_FIELDS' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    if (body.amount <= 0 || body.amount > 10000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid amount. Must be between 0.01 and 10000', 
          error_code: 'INVALID_AMOUNT' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find recipient by email
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.recipient_email.trim())
      .eq('is_active', true)
      .single();

    if (recipientError || !recipientProfile) {
      console.error('Recipient not found:', recipientError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Recipient not found', 
          error_code: 'RECIPIENT_NOT_FOUND' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-transfer
    if (userId === recipientProfile.id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot transfer to yourself', 
          error_code: 'SELF_TRANSFER' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the secure transfer database function
    console.log('Calling process_secure_wallet_transfer_v2');
    const { data: transferResult, error: transferError } = await supabase.rpc(
      'process_secure_wallet_transfer_v2',
      {
        sender_id: userId,
        recipient_id: recipientProfile.id,
        transfer_amount: body.amount,
        transfer_description: body.description || `Transfer to ${body.recipient_email}`,
        sender_pin: body.user_pin || null
      }
    );

    if (transferError) {
      console.error('Transfer function error:', transferError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: transferError.message || 'Transfer failed', 
          error_code: 'TRANSFER_FAILED' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transferResult?.success) {
      console.error('Transfer unsuccessful:', transferResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: transferResult?.error || 'Transfer failed', 
          error_code: 'TRANSFER_REJECTED' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create success response
    const response: TransferResponse = {
      success: true,
      data: {
        transaction_id: `TXN-${Date.now()}`,
        reference_id: transferResult.reference_id,
        sender_new_balance: transferResult.sender_new_balance,
        recipient_new_balance: transferResult.recipient_new_balance,
        pin_verified: transferResult.pin_verified || false,
        daily_limit_remaining: transferResult.daily_limit_remaining || 0
      }
    };

    console.log('Transfer successful:', response.data?.reference_id);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error', 
        error_code: 'INTERNAL_ERROR' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
