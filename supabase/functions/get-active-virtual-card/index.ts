
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  static getMaskedCardNumber(cardId: string): string {
    const fullNumber = this.getConsistentCardNumber(cardId);
    return `${fullNumber.substring(0, 4)} **** **** ${fullNumber.substring(12, 16)}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authorization header required',
          has_cards: false,
          total_cards: 0
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and validate the JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log('Processing token:', token.substring(0, 20) + '...');

    // Verify the JWT token using the anon key client
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid or expired token',
          has_cards: false,
          total_cards: 0,
          debug: {
            auth_error: authError?.message || 'No user found',
            token_provided: !!token
          }
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user:', user.id, 'Email:', user.email);

    // Now use service role client to query the database
    const { data: cards, error: cardsError } = await supabaseClient
      .from('virtual_cards')
      .select(`
        id,
        user_id,
        masked_card_number,
        expiry_date,
        status,
        card_type,
        issuer_name,
        created_at,
        updated_at,
        last_used_at,
        activation_date,
        daily_limit,
        monthly_limit,
        current_daily_spent,
        current_monthly_spent,
        metadata
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cardsError) {
      console.error('Database query error:', cardsError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch virtual cards: ' + cardsError.message,
          has_cards: false,
          total_cards: 0,
          debug: {
            user_id: user.id,
            db_error: cardsError.message
          }
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Database query successful. Found cards:', cards?.length || 0);
    
    if (cards) {
      cards.forEach(card => {
        console.log(`Card ${card.id}: status=${card.status}, expiry=${card.expiry_date}, user=${card.user_id}`);
      });
    }

    // Filter active cards that are not expired
    const activeCards = cards?.filter(card => {
      const expiryDate = new Date(card.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const isActive = card.status === 'active';
      const notExpired = expiryDate >= today;
      
      console.log(`Card ${card.id}: status=${card.status}, expiry=${card.expiry_date}, isActive=${isActive}, notExpired=${notExpired}`);
      
      return isActive && notExpired;
    }) || [];

    console.log('Active cards found:', activeCards.length);

    // Get the primary card (most recently created active card)
    const primaryCard = activeCards.length > 0 ? activeCards[0] : null;

    if (!primaryCard) {
      console.log('No active cards available');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No active virtual card found',
          has_cards: cards?.length > 0,
          total_cards: cards?.length || 0,
          debug: {
            total_cards_found: cards?.length || 0,
            active_cards_found: activeCards.length,
            user_id: user.id,
            user_email: user.email,
            all_cards: cards?.map(c => ({
              id: c.id,
              status: c.status,
              expiry_date: c.expiry_date,
              user_id: c.user_id
            })) || []
          }
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Returning primary card:', primaryCard.id);

    // Use consistent card number generation
    const consistentMaskedNumber = CardNumberUtils.getMaskedCardNumber(primaryCard.id);

    // Return the active card details
    return new Response(
      JSON.stringify({
        success: true,
        card: {
          id: primaryCard.id,
          user_id: primaryCard.user_id,
          masked_card_number: consistentMaskedNumber,
          expiry_date: primaryCard.expiry_date,
          status: primaryCard.status,
          card_type: primaryCard.card_type,
          issuer_name: primaryCard.issuer_name,
          daily_limit: Number(primaryCard.daily_limit || 5000),
          monthly_limit: Number(primaryCard.monthly_limit || 50000),
          current_daily_spent: Number(primaryCard.current_daily_spent || 0),
          current_monthly_spent: Number(primaryCard.current_monthly_spent || 0),
          daily_remaining: Number(primaryCard.daily_limit || 5000) - Number(primaryCard.current_daily_spent || 0),
          monthly_remaining: Number(primaryCard.monthly_limit || 50000) - Number(primaryCard.current_monthly_spent || 0),
          is_transaction_ready: true,
          last_used_at: primaryCard.last_used_at,
          created_at: primaryCard.created_at,
          metadata: primaryCard.metadata || {}
        },
        total_active_cards: activeCards.length
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-active-virtual-card:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error: ' + error.message,
        has_cards: false,
        total_cards: 0,
        debug: {
          error_type: error.constructor.name,
          error_message: error.message
        }
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
