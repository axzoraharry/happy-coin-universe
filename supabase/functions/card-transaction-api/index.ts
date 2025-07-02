import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionRequest {
  endpoint: string;
  card_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
}

interface ProcessPaymentRequest {
  endpoint: string;
  card_number: string;
  pin: string;
  amount: number;
  merchant_id: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Card Transaction API - Request received:', req.method, req.url);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const endpoint = requestBody.endpoint;
    console.log('Processing endpoint:', endpoint);

    // Handle different API endpoints based on the endpoint field in request body
    switch (endpoint) {
      case 'process-transaction':
        return await handleProcessTransaction(requestBody, supabaseClient, user.id);
      
      case 'process-payment':
        return await handleProcessPayment(requestBody, supabaseClient);
      
      case 'get-analytics':
        return await handleGetAnalytics(requestBody, supabaseClient, user.id);
      
      case 'get-transactions':
        return await handleGetTransactions(requestBody, supabaseClient, user.id);
      
      case 'validate-limits':
        return await handleValidateLimits(requestBody, supabaseClient, user.id);
      
      default:
        console.error('Invalid endpoint:', endpoint);
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint: ' + endpoint }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Unexpected error in card-transaction-api:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleProcessTransaction(body: TransactionRequest, supabaseClient: any, userId: string) {
  try {
    console.log('Processing transaction with body:', body);
    
    if (!body.card_id || !body.transaction_type) {
      console.error('Missing required fields:', { card_id: body.card_id, transaction_type: body.transaction_type });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: card_id, transaction_type' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Special handling for validation transactions - they don't require amount validation
    if (body.transaction_type === 'validation') {
      console.log('Processing validation transaction');
      
      // For validation transactions, we just check if the card exists and is active
      const { data: cardData, error: cardError } = await supabaseClient
        .from('virtual_cards')
        .select('id, status, expiry_date, daily_limit, monthly_limit, current_daily_spent, current_monthly_spent')
        .eq('id', body.card_id)
        .eq('user_id', userId)
        .single();

      if (cardError || !cardData) {
        console.error('Card not found or access denied:', cardError);
        return new Response(
          JSON.stringify({ success: false, error: 'Card not found or access denied' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (cardData.status !== 'active') {
        console.error('Card is not active:', cardData.status);
        return new Response(
          JSON.stringify({ success: false, error: 'Card is not active' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if card is expired
      const expiryDate = new Date(cardData.expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        console.error('Card has expired:', cardData.expiry_date);
        return new Response(
          JSON.stringify({ success: false, error: 'Card has expired' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create validation transaction record
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from('virtual_card_transactions')
        .insert({
          card_id: body.card_id,
          user_id: userId,
          transaction_type: 'validation',
          amount: 0,
          description: body.description || 'Card validation',
          merchant_info: body.merchant_info || {},
          reference_id: body.reference_id || `VAL_${Date.now()}_${body.card_id.substring(0, 8)}`,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Failed to create validation transaction:', transactionError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to record validation transaction' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Validation transaction completed successfully:', transactionData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction_id: transactionData.id,
          card_status: cardData.status,
          daily_remaining: cardData.daily_limit - cardData.current_daily_spent,
          monthly_remaining: cardData.monthly_limit - cardData.current_monthly_spent,
          message: 'Card validation successful'
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For purchase transactions, validate amount
    if (body.transaction_type === 'purchase' && (body.amount === undefined || body.amount < 0)) {
      console.error('Invalid amount for purchase:', body.amount);
      return new Response(
        JSON.stringify({ error: 'Amount must be specified and non-negative for purchase transactions' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling process_card_transaction function...');

    const { data, error } = await supabaseClient.rpc('process_card_transaction', {
      p_card_id: body.card_id,
      p_transaction_type: body.transaction_type,
      p_amount: body.amount || 0,
      p_description: body.description || '',
      p_merchant_info: body.merchant_info || {},
      p_reference_id: body.reference_id
    });

    if (error) {
      console.error('Database function error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Transaction processed successfully:', data);

    return new Response(
      JSON.stringify({ success: true, ...data }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Transaction processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process transaction: ' + error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleProcessPayment(body: ProcessPaymentRequest, supabaseClient: any) {
  try {
    
    if (!body.card_number || !body.pin || !body.amount || !body.merchant_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: card_number, pin, amount, merchant_id' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // First validate the card
    const { data: validationData, error: validationError } = await supabaseClient.rpc('validate_virtual_card', {
      p_card_number: body.card_number,
      p_pin: body.pin,
      p_ip_address: body.ip_address,
      p_user_agent: body.user_agent
    });

    if (validationError || !validationData?.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: validationData?.error || 'Card validation failed' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process the payment transaction
    const { data: transactionData, error: transactionError } = await supabaseClient.rpc('process_card_transaction', {
      p_card_id: validationData.card_id,
      p_transaction_type: 'purchase',
      p_amount: body.amount,
      p_description: body.description || `Payment to merchant ${body.merchant_id}`,
      p_merchant_info: {
        merchant_id: body.merchant_id,
        ip_address: body.ip_address,
        user_agent: body.user_agent
      },
      p_reference_id: `PAY_${Date.now()}_${validationData.card_id?.substring(0, 8)}`
    });

    if (transactionError || !transactionData?.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: transactionData?.error || 'Payment processing failed' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionData.transaction_id,
        daily_remaining: transactionData.daily_remaining,
        monthly_remaining: transactionData.monthly_remaining
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Payment processing failed: ' + error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleGetAnalytics(body: any, supabaseClient: any, userId: string) {
  try {
    const cardId = body.card_id;

    let query = supabaseClient
      .from('card_transaction_analytics')
      .select('*')
      .eq('user_id', userId);

    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Analytics fetch error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch analytics: ' + error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analytics: data || [] }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to get analytics: ' + error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleGetTransactions(body: any, supabaseClient: any, userId: string) {
  try {
    const cardId = body.card_id;
    const limit = body.limit || 50;
    const offset = body.offset || 0;

    let query = supabaseClient
      .from('virtual_card_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Transactions fetch error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch transactions: ' + error.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, transactions: data || [] }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Transactions error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to get transactions: ' + error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleValidateLimits(body: any, supabaseClient: any, userId: string) {
  try {
    const { card_id, amount } = body;

    if (!card_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: card_id, amount' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data, error } = await supabaseClient
      .from('virtual_cards')
      .select('daily_limit, monthly_limit, current_daily_spent, current_monthly_spent')
      .eq('id', card_id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Card not found: ' + (error?.message || 'Not found') }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const dailyRemaining = data.daily_limit - data.current_daily_spent;
    const monthlyRemaining = data.monthly_limit - data.current_monthly_spent;

    const validation = {
      valid: amount <= dailyRemaining && amount <= monthlyRemaining,
      daily_remaining: dailyRemaining,
      monthly_remaining: monthlyRemaining,
      daily_limit: data.daily_limit,
      monthly_limit: data.monthly_limit,
      daily_spent: data.current_daily_spent,
      monthly_spent: data.current_monthly_spent,
      error: amount > dailyRemaining ? 'Daily limit exceeded' : 
             amount > monthlyRemaining ? 'Monthly limit exceeded' : null
    };

    return new Response(
      JSON.stringify({ success: true, validation }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Limit validation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to validate limits: ' + error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
