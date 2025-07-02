
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

// Enhanced transaction processing with card number support
async function processCardTransactionByNumber(supabase: any, params: {
  card_number: string;
  transaction_type: 'purchase' | 'refund' | 'validation' | 'activation' | 'deactivation';
  amount?: number;
  description?: string;
  merchant_info?: Record<string, any>;
  reference_id?: string;
  user_id?: string;
}) {
  console.log('Processing card transaction by number:', { ...params, card_number: '****' + params.card_number.slice(-4) });

  const { data, error } = await supabase.rpc('process_card_transaction_by_number', {
    p_card_number: params.card_number,
    p_transaction_type: params.transaction_type,
    p_amount: params.amount || 0,
    p_description: params.description || '',
    p_merchant_info: params.merchant_info || {},
    p_reference_id: params.reference_id,
    p_user_id: params.user_id
  });

  if (error) {
    console.error('Transaction processing error:', error);
    throw error;
  }

  return data;
}

// Validate transaction limits by card number
async function validateTransactionLimitsByNumber(supabase: any, cardNumber: string, amount: number, userId?: string) {
  const { data, error } = await supabase.rpc('validate_transaction_limits_by_number', {
    p_card_number: cardNumber,
    p_amount: amount,
    p_user_id: userId
  });

  if (error) {
    console.error('Limit validation error:', error);
    throw error;
  }

  return data;
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
          card_number: txnCardNumber,
          transaction_type, 
          amount = 0, 
          description, 
          merchant_info = {},
          reference_id,
          user_id: txnUserId
        } = transactionBody;

        if (!txnCardNumber || !transaction_type) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_number and transaction_type are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const transactionResult = await processCardTransactionByNumber(supabaseClient, {
          card_number: txnCardNumber,
          transaction_type,
          amount,
          description,
          merchant_info,
          reference_id,
          user_id: txnUserId
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
        const { card_number: limitsCardNumber, amount: limitsAmount, user_id: limitsUserId } = limitsBody;

        if (!limitsCardNumber || limitsAmount === undefined) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_number and amount are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const limitValidation = await validateTransactionLimitsByNumber(supabaseClient, limitsCardNumber, limitsAmount, limitsUserId);

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
        const { card_number: detailsCardNumber, user_pin, user_id: detailsUserId } = detailsBody;

        if (!detailsCardNumber) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_number is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get card details using the new function
        const { data: cardData, error: cardError } = await supabaseClient.rpc('get_card_by_number', {
          p_card_number: detailsCardNumber,
          p_user_id: detailsUserId
        });

        if (cardError || !cardData || cardData.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'Card not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cardRecord = cardData[0];
        const cardDetails = {
          success: true,
          card: {
            id: cardRecord.card_id,
            card_number: CardNumberUtils.getConsistentCardNumber(cardRecord.card_id),
            cvv: CardNumberUtils.getConsistentCVV(cardRecord.card_id),
            expiry_date: cardRecord.expiry_date,
            status: cardRecord.status,
            daily_limit: Number(cardRecord.daily_limit),
            monthly_limit: Number(cardRecord.monthly_limit),
            current_daily_spent: Number(cardRecord.current_daily_spent),
            current_monthly_spent: Number(cardRecord.current_monthly_spent),
            daily_remaining: Number(cardRecord.daily_limit) - Number(cardRecord.current_daily_spent),
            monthly_remaining: Number(cardRecord.monthly_limit) - Number(cardRecord.current_monthly_spent)
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

        const cardNumberParam = url.searchParams.get('card_number');
        const limitParam = url.searchParams.get('limit') || '50';
        const userIdParam = url.searchParams.get('user_id');

        if (!cardNumberParam) {
          return new Response(
            JSON.stringify({ success: false, error: 'card_number parameter is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First get the card ID from the card number
        const { data: cardLookup, error: cardLookupError } = await supabaseClient.rpc('get_card_by_number', {
          p_card_number: cardNumberParam,
          p_user_id: userIdParam
        });

        if (cardLookupError || !cardLookup || cardLookup.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'Card not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cardId = cardLookup[0].card_id;

        const { data: transactions, error: transactionsError } = await supabaseClient
          .from('virtual_card_transactions')
          .select('*')
          .eq('card_id', cardId)
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
