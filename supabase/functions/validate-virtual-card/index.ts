
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { card_number, pin, merchant_id, amount, ip_address, user_agent, action = 'validate' } = await req.json();

    // Validate required fields
    if (!card_number || !pin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Card number and PIN are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate card number format (16 digits)
    if (!/^\d{16}$/.test(card_number)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Card number must be 16 digits' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PIN must be 4 digits' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing virtual card request:', { 
      action,
      card_number: card_number.substring(0, 4) + '****', 
      merchant_id,
      amount,
      ip_address: ip_address || req.headers.get('x-forwarded-for')
    });

    // Call the database function to validate card
    const { data: validationResult, error: validationError } = await supabaseClient
      .rpc('validate_virtual_card', {
        p_card_number: card_number,
        p_pin: pin,
        p_ip_address: ip_address || req.headers.get('x-forwarded-for'),
        p_user_agent: user_agent || req.headers.get('user-agent')
      });

    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database validation failed: ' + validationError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Validation result:', validationResult);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationResult.error || 'Card validation failed',
          cards_checked: validationResult.cards_checked || 0
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If this is just a validation request, return early
    if (action === 'validate') {
      return new Response(
        JSON.stringify({
          success: true,
          card_id: validationResult.card_id,
          user_id: validationResult.user_id,
          status: validationResult.status,
          daily_limit: validationResult.daily_limit,
          monthly_limit: validationResult.monthly_limit,
          daily_spent: validationResult.daily_spent,
          monthly_spent: validationResult.monthly_spent,
          daily_remaining: validationResult.daily_limit - validationResult.daily_spent,
          monthly_remaining: validationResult.monthly_limit - validationResult.monthly_spent,
          validated_at: new Date().toISOString(),
          cards_checked: validationResult.cards_checked || 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process payment if amount is provided and action is 'payment'
    if (action === 'payment' && amount && amount > 0) {
      const dailyRemaining = validationResult.daily_limit - validationResult.daily_spent;
      const monthlyRemaining = validationResult.monthly_limit - validationResult.monthly_spent;

      if (amount > dailyRemaining) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Daily spending limit exceeded',
            daily_limit: validationResult.daily_limit,
            daily_spent: validationResult.daily_spent,
            daily_remaining: dailyRemaining
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (amount > monthlyRemaining) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Monthly spending limit exceeded',
            monthly_limit: validationResult.monthly_limit,
            monthly_spent: validationResult.monthly_spent,
            monthly_remaining: monthlyRemaining
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update spending amounts
      const { error: updateError } = await supabaseClient
        .from('virtual_cards')
        .update({
          current_daily_spent: validationResult.daily_spent + amount,
          current_monthly_spent: validationResult.monthly_spent + amount,
          last_used_at: new Date().toISOString()
        })
        .eq('id', validationResult.card_id);

      if (updateError) {
        console.error('Error updating card spending:', updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to process payment: ' + updateError.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Record the transaction
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from('virtual_card_transactions')
        .insert({
          card_id: validationResult.card_id,
          user_id: validationResult.user_id,
          transaction_type: 'purchase',
          amount: amount,
          description: `Payment to merchant: ${merchant_id || 'Unknown'}`,
          merchant_info: {
            merchant_id: merchant_id,
            ip_address: ip_address,
            user_agent: user_agent
          },
          reference_id: `PAY_${Date.now()}_${validationResult.card_id.substring(0, 8)}`,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Failed to record transaction:', transactionError);
        // Don't fail the payment if we can't record the transaction
      }

      console.log('Payment processed successfully:', transactionData?.id);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionData?.id,
          card_id: validationResult.card_id,
          amount_charged: amount,
          new_daily_spent: validationResult.daily_spent + amount,
          new_monthly_spent: validationResult.monthly_spent + amount,
          daily_remaining: dailyRemaining - amount,
          monthly_remaining: monthlyRemaining - amount,
          processed_at: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For validation with amount but no payment action
    if (amount && amount > 0) {
      const dailyRemaining = validationResult.daily_limit - validationResult.daily_spent;
      const monthlyRemaining = validationResult.monthly_limit - validationResult.monthly_spent;

      // Record validation transaction
      try {
        await supabaseClient
          .from('virtual_card_transactions')
          .insert({
            card_id: validationResult.card_id,
            user_id: validationResult.user_id,
            transaction_type: 'validation',
            amount: amount,
            description: `Card validation for merchant: ${merchant_id || 'Unknown'}`,
            merchant_info: {
              merchant_id: merchant_id,
              ip_address: ip_address,
              user_agent: user_agent
            },
            reference_id: `VAL_${Date.now()}_${validationResult.card_id.substring(0, 8)}`,
            status: 'completed'
          });

        console.log('Validation transaction recorded successfully');
      } catch (error) {
        console.error('Failed to record validation transaction:', error);
        // Don't fail the validation if we can't record the transaction
      }

      return new Response(
        JSON.stringify({
          success: true,
          card_id: validationResult.card_id,
          user_id: validationResult.user_id,
          status: validationResult.status,
          daily_limit: validationResult.daily_limit,
          monthly_limit: validationResult.monthly_limit,
          daily_spent: validationResult.daily_spent,
          monthly_spent: validationResult.monthly_spent,
          daily_remaining: dailyRemaining,
          monthly_remaining: monthlyRemaining,
          amount_authorized: amount <= Math.min(dailyRemaining, monthlyRemaining),
          validated_at: new Date().toISOString(),
          cards_checked: validationResult.cards_checked || 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Default validation response
    return new Response(
      JSON.stringify({
        success: true,
        card_id: validationResult.card_id,
        user_id: validationResult.user_id,
        status: validationResult.status,
        daily_limit: validationResult.daily_limit,
        monthly_limit: validationResult.monthly_limit,
        daily_spent: validationResult.daily_spent,
        monthly_spent: validationResult.monthly_spent,
        daily_remaining: validationResult.daily_limit - validationResult.daily_spent,
        monthly_remaining: validationResult.monthly_limit - validationResult.monthly_spent,
        validated_at: new Date().toISOString(),
        cards_checked: validationResult.cards_checked || 0
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Virtual card processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
