
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    console.log('Checking for failed payments for user:', user.email);

    // Get recent successful payments from Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ message: 'No Stripe customer found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    
    // Get checkout sessions from the last 24 hours
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      created: { gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000) },
      limit: 10
    });

    const successfulSessions = sessions.data.filter(s => s.payment_status === 'paid');
    console.log(`Found ${successfulSessions.length} successful sessions`);

    let recoveredCoins = 0;
    const recoveredPayments = [];

    for (const session of successfulSessions) {
      const happyCoins = parseInt(session.metadata?.happy_coins || "0");
      if (!happyCoins) continue;

      // Check if we already processed this payment
      const { data: existingTransaction } = await supabaseClient
        .from('transactions')
        .select('id')
        .eq('reference_id', session.id)
        .eq('user_id', user.id)
        .single();

      if (existingTransaction) {
        console.log('Payment already processed:', session.id);
        continue;
      }

      console.log('Recovering payment:', session.id, 'for', happyCoins, 'HC');

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        console.error('Wallet error:', walletError);
        continue;
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance.toString()) + happyCoins;
      await supabaseClient
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      // Create transaction record
      await supabaseClient
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          transaction_type: 'credit',
          amount: happyCoins,
          description: `Recovered payment: ${happyCoins} Happy Coins (₹${happyCoins * 1000})`,
          reference_id: session.id,
          status: 'completed'
        });

      recoveredCoins += happyCoins;
      recoveredPayments.push({
        session_id: session.id,
        amount: happyCoins,
        amount_inr: happyCoins * 1000
      });
    }

    if (recoveredCoins > 0) {
      // Create notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Coins Recovered',
          message: `${recoveredCoins} HC has been recovered and added to your wallet`,
          type: 'success'
        });
    }

    return new Response(JSON.stringify({
      message: recoveredCoins > 0 ? `Recovered ${recoveredCoins} Happy Coins` : 'No failed payments found',
      recovered_coins: recoveredCoins,
      recovered_payments: recoveredPayments
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Recovery error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
