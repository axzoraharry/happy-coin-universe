
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  
  let receivedEvent;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return new Response(`Webhook signature verification failed.`, { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  console.log('Received webhook event:', receivedEvent.type);

  if (receivedEvent.type === "checkout.session.completed") {
    const session = receivedEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const happyCoins = parseInt(session.metadata?.happy_coins || "0");

    console.log('Processing payment for user:', userId, 'coins:', happyCoins);

    if (userId && happyCoins > 0) {
      try {
        // Get user's wallet
        const { data: wallet, error: walletError } = await supabaseClient
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (walletError) {
          console.error('Wallet error:', walletError);
          throw walletError;
        }

        console.log('Current wallet balance:', wallet.balance);

        // Update wallet balance
        const newBalance = parseFloat(wallet.balance.toString()) + happyCoins;
        const { error: updateError } = await supabaseClient
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);

        if (updateError) {
          console.error('Balance update error:', updateError);
          throw updateError;
        }

        console.log('Updated balance to:', newBalance);

        // Create transaction record
        const { error: transactionError } = await supabaseClient
          .from('transactions')
          .insert({
            wallet_id: wallet.id,
            user_id: userId,
            transaction_type: 'credit',
            amount: happyCoins,
            description: `Purchase of ${happyCoins} Happy Coins (₹${happyCoins * 1000})`,
            reference_id: session.id,
            status: 'completed'
          });

        if (transactionError) {
          console.error('Transaction record error:', transactionError);
          throw transactionError;
        }

        console.log('Transaction record created');

        // Create notification
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Happy Coins Added',
            message: `${happyCoins} HC has been added to your wallet`,
            type: 'success'
          });

        if (notificationError) {
          console.error('Notification error:', notificationError);
          // Don't throw here as it's not critical
        }

        console.log(`Successfully processed payment for user ${userId}: ${happyCoins} HC (₹${happyCoins * 1000})`);
      } catch (error) {
        console.error('Error processing payment:', error);
        return new Response(JSON.stringify({ error: 'Payment processing failed' }), { status: 500 });
      }
    } else {
      console.log('Missing user_id or happy_coins in session metadata');
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
