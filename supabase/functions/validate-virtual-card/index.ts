
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

    const { card_number, pin, merchant_id, amount, ip_address, user_agent } = await req.json();

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

    console.log('Validating virtual card:', { 
      card_number: card_number.substring(0, 4) + '****', 
      merchant_id,
      amount,
      ip_address 
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
      throw validationError;
    }

    console.log('Validation result:', validationResult);

    // If validation successful and amount provided, check spending limits
    if (validationResult.success && amount && amount > 0) {
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

      // If transaction amount is provided, record it as a validation transaction
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
    }

    return new Response(
      JSON.stringify({
        success: validationResult.success,
        card_id: validationResult.card_id,
        user_id: validationResult.user_id,
        status: validationResult.status,
        daily_limit: validationResult.daily_limit,
        monthly_limit: validationResult.monthly_limit,
        daily_spent: validationResult.daily_spent,
        monthly_spent: validationResult.monthly_spent,
        daily_remaining: validationResult.daily_limit - validationResult.daily_spent,
        monthly_remaining: validationResult.monthly_limit - validationResult.monthly_spent,
        error: validationResult.error,
        validated_at: new Date().toISOString()
      }),
      { 
        status: validationResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Virtual card validation error:', error);
    
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
