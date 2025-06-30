
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionRequest {
  card_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
}

interface ProcessPaymentRequest {
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle different API endpoints
    switch (path) {
      case 'process-transaction':
        return await handleProcessTransaction(req, supabaseClient, user.id);
      
      case 'process-payment':
        return await handleProcessPayment(req, supabaseClient);
      
      case 'get-analytics':
        return await handleGetAnalytics(req, supabaseClient, user.id);
      
      case 'get-transactions':
        return await handleGetTransactions(req, supabaseClient, user.id);
      
      case 'validate-limits':
        return await handleValidateLimits(req, supabaseClient, user.id);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleProcessTransaction(req: Request, supabaseClient: any, userId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const body: TransactionRequest = await req.json();
  
  if (!body.card_id || !body.transaction_type) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: card_id, transaction_type' }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { data, error } = await supabaseClient.rpc('process_card_transaction', {
      p_card_id: body.card_id,
      p_transaction_type: body.transaction_type,
      p_amount: body.amount || 0,
      p_description: body.description || '',
      p_merchant_info: body.merchant_info || {},
      p_reference_id: body.reference_id
    });

    if (error) {
      console.error('Transaction processing error:', error);
      return new Response(
        JSON.stringify({ error: 'Transaction processing failed' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify(data), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Transaction error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process transaction' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleProcessPayment(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const body: ProcessPaymentRequest = await req.json();
  
  if (!body.card_number || !body.pin || !body.amount || !body.merchant_id) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: card_number, pin, amount, merchant_id' }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
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

    // Check spending limits
    const dailyRemaining = (validationData.daily_limit || 0) - (validationData.daily_spent || 0);
    const monthlyRemaining = (validationData.monthly_limit || 0) - (validationData.monthly_spent || 0);

    if (body.amount > dailyRemaining) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Daily spending limit exceeded',
          daily_remaining: dailyRemaining 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (body.amount > monthlyRemaining) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Monthly spending limit exceeded',
          monthly_remaining: monthlyRemaining 
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
        error: 'Payment processing failed' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleGetAnalytics(req: Request, supabaseClient: any, userId: string) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const url = new URL(req.url);
  const cardId = url.searchParams.get('card_id');

  try {
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
        JSON.stringify({ error: 'Failed to fetch analytics' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analytics: data }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get analytics' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleGetTransactions(req: Request, supabaseClient: any, userId: string) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const url = new URL(req.url);
  const cardId = url.searchParams.get('card_id');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
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
        JSON.stringify({ error: 'Failed to fetch transactions' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, transactions: data }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Transactions error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get transactions' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleValidateLimits(req: Request, supabaseClient: any, userId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const body = await req.json();
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

  try {
    const { data, error } = await supabaseClient
      .from('virtual_cards')
      .select('daily_limit, monthly_limit, current_daily_spent, current_monthly_spent')
      .eq('id', card_id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Card not found' }), 
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
      JSON.stringify({ error: 'Failed to validate limits' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
