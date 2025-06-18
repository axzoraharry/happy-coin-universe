
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced CORS headers with security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

interface PaymentRequest {
  external_order_id: string;
  user_email: string;
  amount: number;
  description?: string;
  callback_url?: string;
  metadata?: any;
  user_pin?: string;
}

// Input validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && amount <= 10000 && Number.isFinite(amount);
};

const validateOrderId = (orderId: string): boolean => {
  return typeof orderId === 'string' && orderId.length > 0 && orderId.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(orderId);
};

const sanitizeString = (input: string, maxLength: number = 500): string => {
  return input.replace(/[<>]/g, '').trim().slice(0, maxLength);
};

const validateApiKey = (apiKey: string): boolean => {
  return typeof apiKey === 'string' && /^ak_[A-Za-z0-9_-]{24,}$/.test(apiKey);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Get API key from headers with validation
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || !validateApiKey(apiKey)) {
      console.log('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Valid API key required in x-api-key header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate request body
    let paymentData: PaymentRequest;
    try {
      paymentData = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Secure payment request received:', {
      external_order_id: paymentData.external_order_id,
      user_email: paymentData.user_email,
      amount: paymentData.amount,
      has_pin: !!paymentData.user_pin
    });

    // Comprehensive input validation
    if (!paymentData.external_order_id || !validateOrderId(paymentData.external_order_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid external_order_id format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!paymentData.user_email || !validateEmail(paymentData.user_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!validateAmount(paymentData.amount)) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount: must be positive number ≤ 10,000' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize string inputs
    const sanitizedData = {
      ...paymentData,
      external_order_id: sanitizeString(paymentData.external_order_id, 100),
      user_email: sanitizeString(paymentData.user_email, 254),
      description: paymentData.description ? sanitizeString(paymentData.description, 500) : undefined,
      user_pin: paymentData.user_pin ? paymentData.user_pin.replace(/\D/g, '').slice(0, 4) : undefined
    };

    // Validate PIN format if provided
    if (sanitizedData.user_pin && !/^\d{4}$/.test(sanitizedData.user_pin)) {
      return new Response(
        JSON.stringify({ error: 'PIN must be exactly 4 digits' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with enhanced error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing secure payment request for order: ${sanitizedData.external_order_id}`);

    // Process the payment using the secure database function
    const { data: result, error } = await supabase.rpc('process_external_payment_secure', {
      p_api_key: apiKey,
      p_external_order_id: sanitizedData.external_order_id,
      p_user_email: sanitizedData.user_email,
      p_amount: sanitizedData.amount,
      p_description: sanitizedData.description || 'External payment',
      p_callback_url: paymentData.callback_url || null,
      p_metadata: paymentData.metadata || null,
      p_user_pin: sanitizedData.user_pin || null
    });

    if (error) {
      console.error('Database RPC error:', error);
      
      // Enhanced error handling
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Payment processing service unavailable' }),
          { 
            status: 503, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Payment processing failed: ' + error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Database function result:', result);

    if (!result) {
      console.error('No result returned from database function');
      return new Response(
        JSON.stringify({ error: 'No response from payment processor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!result.success) {
      console.log('Payment failed:', result.error);
      
      // Check if PIN is required
      if (result.pin_required) {
        return new Response(
          JSON.stringify({ 
            error: result.error || 'PIN verification required',
            pin_required: true
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: result.error || 'Payment processing failed' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Payment processed successfully:', {
      payment_request_id: result.payment_request_id,
      transaction_id: result.transaction_id,
      pin_verified: result.pin_verified
    });

    // Secure webhook delivery (if callback URL provided)
    if (paymentData.callback_url) {
      try {
        const webhookPayload = {
          external_order_id: sanitizedData.external_order_id,
          payment_request_id: result.payment_request_id,
          transaction_id: result.transaction_id,
          reference_id: result.reference_id,
          amount: sanitizedData.amount,
          status: 'completed',
          timestamp: new Date().toISOString(),
          metadata: paymentData.metadata,
          pin_verified: result.pin_verified || false
        };

        // Enhanced webhook security
        const webhookResponse = await fetch(paymentData.callback_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HappyCoins-Webhook/1.0',
            'X-HappyCoins-Signature': 'webhook_signature_placeholder' // TODO: Implement HMAC signature
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        // Log webhook delivery result
        await supabase.from('webhook_logs').insert({
          api_key_id: result.api_key_id,
          payment_request_id: result.payment_request_id,
          webhook_url: paymentData.callback_url,
          payload: webhookPayload,
          success: webhookResponse.ok,
          response_status: webhookResponse.status,
          response_body: await webhookResponse.text().catch(() => null)
        });

        console.log('Webhook delivered:', webhookResponse.ok, webhookResponse.status);
      } catch (webhookError) {
        console.error('Webhook delivery failed:', webhookError);
        // Log webhook failure but don't fail the payment
        await supabase.from('webhook_logs').insert({
          api_key_id: result.api_key_id,
          payment_request_id: result.payment_request_id,
          webhook_url: paymentData.callback_url,
          payload: {
            external_order_id: sanitizedData.external_order_id,
            payment_request_id: result.payment_request_id,
            error: webhookError.message
          },
          success: false,
          response_body: webhookError.message
        });
      }
    }

    // Return success response with security headers
    return new Response(
      JSON.stringify({
        success: true,
        payment_request_id: result.payment_request_id,
        transaction_id: result.transaction_id,
        reference_id: result.reference_id,
        new_balance: result.new_balance,
        pin_verified: result.pin_verified || false,
        message: 'Payment processed successfully'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99' // TODO: Implement actual rate limiting
        } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
