
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
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

    // Set the auth header for the supabase client
    supabaseClient.auth.setSession = authHeader;

    // Get user from token
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

    // Get the user's active virtual cards
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
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch virtual cards' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter cards that are ready for transactions (active and not expired)
    const activeCards = cards?.filter(card => {
      const expiryDate = new Date(card.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return card.status === 'active' && expiryDate >= today;
    }) || [];

    // Get the primary card (most recently created active card)
    const primaryCard = activeCards.length > 0 ? activeCards[0] : null;

    if (!primaryCard) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No active virtual card found',
          has_cards: cards?.length > 0,
          total_cards: cards?.length || 0
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the active card details
    return new Response(
      JSON.stringify({
        success: true,
        card: {
          id: primaryCard.id,
          user_id: primaryCard.user_id,
          masked_card_number: primaryCard.masked_card_number,
          expiry_date: primaryCard.expiry_date,
          status: primaryCard.status,
          card_type: primaryCard.card_type,
          issuer_name: primaryCard.issuer_name,
          daily_limit: Number(primaryCard.daily_limit),
          monthly_limit: Number(primaryCard.monthly_limit),
          current_daily_spent: Number(primaryCard.current_daily_spent),
          current_monthly_spent: Number(primaryCard.current_monthly_spent),
          daily_remaining: Number(primaryCard.daily_limit) - Number(primaryCard.current_daily_spent),
          monthly_remaining: Number(primaryCard.monthly_limit) - Number(primaryCard.current_monthly_spent),
          is_transaction_ready: true,
          last_used_at: primaryCard.last_used_at,
          created_at: primaryCard.created_at,
          metadata: primaryCard.metadata
        },
        total_active_cards: activeCards.length
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

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
