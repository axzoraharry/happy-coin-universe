
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Centralized card number generation utility
class CardNumberUtils {
  private static cardNumberCache = new Map<string, string>();
  
  static getConsistentCardNumber(cardId: string): string {
    if (this.cardNumberCache.has(cardId)) {
      return this.cardNumberCache.get(cardId)!;
    }

    const cardIdHash = cardId.replace(/-/g, '').substring(0, 16);
    const paddedHash = (cardIdHash + '0000000000000000').substring(0, 16);
    
    const numericOnly = paddedHash.split('').map(char => {
      const code = char.charCodeAt(0);
      return (code % 10).toString();
    }).join('');
    
    const fullCardNumber = `4000${numericOnly.substring(4, 16)}`;
    this.cardNumberCache.set(cardId, fullCardNumber);
    
    return fullCardNumber;
  }

  static getConsistentCVV(cardId: string): string {
    const cardIdHash = cardId.replace(/-/g, '');
    const cvvHash = cardIdHash.substring(0, 3);
    const numericCVV = cvvHash.split('').map(char => {
      const code = char.charCodeAt(0);
      return (code % 10).toString();
    }).join('');
    return numericCVV.padStart(3, '0');
  }
}

// Rate limiting helper
class RateLimiter {
  static async checkRateLimit(supabase: any, identifier: string, endpoint: string, limit: number = 100): Promise<boolean> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - 60); // 1 hour window

    const { data: rateLimitData } = await supabase
      .from('rate_limits')
      .select('requests')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (rateLimitData && rateLimitData.requests >= limit) {
      return false;
    }

    // Update or insert rate limit record
    await supabase
      .from('rate_limits')
      .upsert({
        identifier,
        endpoint,
        requests: (rateLimitData?.requests || 0) + 1,
        window_start: new Date().toISOString()
      });

    return true;
  }
}

// API Key validation
async function validateApiKey(supabase: any, apiKey: string) {
  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('id, created_by, application_name, is_active')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyData) {
    return null;
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id);

  return apiKeyData;
}

// Enhanced transaction processing with validation
async function processCardTransaction(supabase: any, params: {
  card_id: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
}) {
  console.log('Processing card transaction:', params);

  const { data, error } = await supabase.rpc('process_card_transaction', {
    p_card_id: params.card_id,
    p_transaction_type: params.transaction_type,
    p_amount: params.amount || 0,
    p_description: params.description || '',
    p_merchant_info: params.merchant_info || {},
    p_reference_id: params.reference_id
  });

  if (error) {
    console.error('Transaction processing error:', error);
    throw error;
  }

  return data;
}

// Validate transaction limits
async function validateTransactionLimits(supabase: any, cardId: string, amount: number) {
  const { data: card, error } = await supabase
    .from('virtual_cards')
    .select('daily_limit, monthly_limit, current_daily_spent, current_monthly_spent')
    .eq('id', cardId)
    .eq('status', 'active')
    .single();

  if (error || !card) {
    return {
      valid: false,
      error: 'Card not found or inactive'
    };
  }

  const dailyRemaining = Number(card.daily_limit) - Number(card.current_daily_spent);
  const monthlyRemaining = Number(card.monthly_limit) - Number(card.current_monthly_spent);

  if (amount > dailyRemaining) {
    return {
      valid: false,
      error: 'Transaction exceeds daily limit',
      daily_remaining: dailyRemaining,
      monthly_remaining: monthlyRemaining,
      daily_limit: Number(card.daily_limit)
    };
  }

  if (amount > monthlyRemaining) {
    return {
      valid: false, 
      error: 'Transaction exceeds monthly limit',
      daily_remaining: dailyRemaining,
      monthly_remaining: monthlyRemaining,
      daily_limit: Number(card.daily_limit)
    };
  }

  return {
    valid: true,
    daily_remaining: dailyRemaining,
    monthly_remaining: monthlyRemaining,
    daily_limit: Number(card.daily_limit)
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Extract API key from headers
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const apiKeyData = await validateApiKey(supabaseClient, apiKey);
    if (!apiKeyData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitOk = await RateLimiter.checkRateLimit(
      supabaseClient, 
      `${apiKeyData.id}-${clientIp}`, 
      req.url,
      100 // 100 requests per hour
    );

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // Route handling
    switch (path) {
      case '/card-transaction-api/issue-card':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const issueBody = await req.json();
        const { user_id, pin, daily_limit = 5000, monthly_limit = 50000 } = issueBody;

        if (!user_id || !pin) {
          return new Response(
            JSON.stringify({ success: false, error: 'user_id and pin are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: issueResult, error: issueError } = await supabaseClient.rpc('issue_virtual_card', {
          p_user_id: user_id,
          p_pin: pin,
          p_daily_limit: daily_limit,
          p_monthly_limit: monthly_limit
        });

        if (issueError) {
          console.error('Card issuance error:', issueError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to issue card' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(issueResult),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case '/card-transaction-api/validate-card':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const validateBody = await req.json();
        const { card_number, pin: validatePin, ip_address, user_agent } = validateBody;

        if (!card_number || !validatePin) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_number and pin are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: validateResult, error: validateError } = await supabaseClient.rpc('validate_virtual_card', {
          p_card_number: card_number,
          p_pin: validatePin,
          p_ip_address: ip_address,
          p_user_agent: user_agent
        });

        if (validateError) {
          console.error('Card validation error:', validateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Validation failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify(validateResult),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case '/card-transaction-api/process-transaction':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const transactionBody = await req.json();
        const { 
          card_id, 
          transaction_type, 
          amount = 0, 
          description, 
          merchant_info = {},
          reference_id 
        } = transactionBody;

        if (!card_id || !transaction_type) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_id and transaction_type are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const transactionResult = await processCardTransaction(supabaseClient, {
          card_id,
          transaction_type,
          amount,
          description,
          merchant_info,
          reference_id
        });

        return new Response(
          JSON.stringify(transactionResult),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case '/card-transaction-api/validate-limits':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const limitsBody = await req.json();
        const { card_id: limitsCardId, amount: limitsAmount } = limitsBody;

        if (!limitsCardId || limitsAmount === undefined) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_id and amount are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const limitValidation = await validateTransactionLimits(supabaseClient, limitsCardId, limitsAmount);

        return new Response(
          JSON.stringify(limitValidation),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case '/card-transaction-api/get-card-details':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const detailsBody = await req.json();
        const { card_id: detailsCardId, user_pin } = detailsBody;

        if (!detailsCardId) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get card details with consistent number generation
        const { data: cardData, error: cardError } = await supabaseClient
          .from('virtual_cards')
          .select('*')
          .eq('id', detailsCardId)
          .eq('status', 'active')
          .single();

        if (cardError || !cardData) {
          return new Response(
            JSON.stringify({ success: false, error: 'Card not found or inactive' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cardDetails = {
          success: true,
          card: {
            id: cardData.id,
            card_number: CardNumberUtils.getConsistentCardNumber(cardData.id),
            cvv: CardNumberUtils.getConsistentCVV(cardData.id),
            expiry_date: cardData.expiry_date,
            status: cardData.status,
            daily_limit: Number(cardData.daily_limit),
            monthly_limit: Number(cardData.monthly_limit),
            current_daily_spent: Number(cardData.current_daily_spent),
            current_monthly_spent: Number(cardData.current_monthly_spent),
            daily_remaining: Number(cardData.daily_limit) - Number(cardData.current_daily_spent),
            monthly_remaining: Number(cardData.monthly_limit) - Number(cardData.current_monthly_spent)
          }
        };

        return new Response(
          JSON.stringify(cardDetails),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case '/card-transaction-api/get-transactions':
        if (req.method !== 'GET') {
          return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cardIdParam = url.searchParams.get('card_id');
        const limitParam = url.searchParams.get('limit') || '50';

        if (!cardIdParam) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_id parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: transactions, error: transactionsError } = await supabaseClient
          .from('virtual_card_transactions')
          .select('*')
          .eq('card_id', cardIdParam)
          .order('created_at', { ascending: false })
          .limit(parseInt(limitParam));

        if (transactionsError) {
          console.error('Transactions fetch error:', transactionsError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch transactions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, transactions }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Unexpected error in card-transaction-api:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
