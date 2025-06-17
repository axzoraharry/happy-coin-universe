
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
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
    // Get API key from headers
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required in x-api-key header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const paymentData: PaymentRequest = await req.json();
    console.log('Payment request received:', {
      external_order_id: paymentData.external_order_id,
      user_email: paymentData.user_email,
      amount: paymentData.amount,
      has_pin: !!paymentData.user_pin
    });

    // Validate required fields
    if (!paymentData.external_order_id || !paymentData.user_email || !paymentData.amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: external_order_id, user_email, amount' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing secure payment request for order: ${paymentData.external_order_id}`);

    // Process the payment using the secure database function
    const { data: result, error } = await supabase.rpc('process_external_payment_secure', {
      p_api_key: apiKey,
      p_external_order_id: paymentData.external_order_id,
      p_user_email: paymentData.user_email,
      p_amount: paymentData.amount,
      p_description: paymentData.description || 'External payment',
      p_callback_url: paymentData.callback_url || null,
      p_metadata: paymentData.metadata || null,
      p_user_pin: paymentData.user_pin || null
    });

    if (error) {
      console.error('Database RPC error:', error);
      
      // Check if it's a specific database error we can handle
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Database function not found' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Database error: ' + error.message }),
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

    // If there's a callback URL, trigger webhook (fire and forget)
    if (paymentData.callback_url) {
      // Start webhook delivery in background
      const webhookPayload = {
        external_order_id: paymentData.external_order_id,
        payment_request_id: result.payment_request_id,
        transaction_id: result.transaction_id,
        reference_id: result.reference_id,
        amount: paymentData.amount,
        status: 'completed',
        timestamp: new Date().toISOString(),
        metadata: paymentData.metadata,
        pin_verified: result.pin_verified || false
      };

      // Fire webhook without waiting
      fetch(paymentData.callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HappyCoins-Webhook/1.0'
        },
        body: JSON.stringify(webhookPayload)
      }).catch(error => {
        console.error('Webhook delivery failed:', error);
        // Log webhook failure to database
        supabase.from('webhook_logs').insert({
          api_key_id: result.api_key_id,
          payment_request_id: result.payment_request_id,
          webhook_url: paymentData.callback_url,
          payload: webhookPayload,
          success: false,
          response_body: error.message
        });
      });
    }

    // Return success response
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error: ' + error.message,
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
