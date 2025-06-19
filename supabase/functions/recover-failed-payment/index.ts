
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

    // Get checkout sessions from the last 7 days to be more thorough
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    
    // List all recent sessions for debugging
    const allSessions = await stripe.checkout.sessions.list({
      created: { gte: sevenDaysAgo },
      limit: 100
    });

    console.log(`Found ${allSessions.data.length} total sessions in last 7 days`);

    // Filter sessions that match this user's email and are paid
    const userSessions = allSessions.data.filter(session => {
      const matchesEmail = session.customer_details?.email === user.email;
      const isPaid = session.payment_status === 'paid';
      const hasMetadata = session.metadata?.user_id === user.id;
      
      console.log(`Session ${session.id}:`, {
        customer_email: session.customer_details?.email,
        payment_status: session.payment_status,
        user_id_metadata: session.metadata?.user_id,
        matches_user: matchesEmail || hasMetadata,
        is_paid: isPaid
      });
      
      return (matchesEmail || hasMetadata) && isPaid;
    });

    console.log(`Found ${userSessions.length} paid sessions for user`);

    let recoveredCoins = 0;
    const recoveredPayments = [];

    for (const session of userSessions) {
      const happyCoins = parseInt(session.metadata?.happy_coins || "0");
      if (!happyCoins) {
        console.log(`Session ${session.id} has no happy_coins metadata`);
        continue;
      }

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

      // Get or create user's wallet
      let { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code === 'PGRST116') {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabaseClient
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            currency: 'USD'
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Failed to create wallet:', createError);
          continue;
        }
        wallet = newWallet;
      } else if (walletError) {
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
      message: recoveredCoins > 0 ? `Recovered ${recoveredCoins} Happy Coins` : 'No pending payments found',
      recovered_coins: recoveredCoins,
      recovered_payments: recoveredPayments,
      debug_info: {
        total_sessions_checked: allSessions.data.length,
        user_sessions_found: userSessions.length,
        user_email: user.email,
        user_id: user.id
      }
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
