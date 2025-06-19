
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  console.log('Webhook received:', req.method, req.url);
  
  if (req.method === "GET") {
    console.log('GET request received - webhook is accessible');
    return new Response("Webhook endpoint is working", { status: 200 });
  }

  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  
  console.log('Received webhook with signature:', signature ? 'present' : 'missing');
  console.log('Body length:', body.length);
  
  if (!signature) {
    console.log('No Stripe signature found');
    return new Response('No Stripe signature found', { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.log('STRIPE_WEBHOOK_SECRET not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }
  
  let receivedEvent;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
    console.log('Webhook signature verified successfully');
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message);
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  console.log('Received webhook event:', receivedEvent.type);
  console.log('Event data keys:', Object.keys(receivedEvent.data.object));

  if (receivedEvent.type === "checkout.session.completed") {
    const session = receivedEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const happyCoins = parseInt(session.metadata?.happy_coins || "0");

    console.log('Processing checkout.session.completed');
    console.log('Session ID:', session.id);
    console.log('User ID from metadata:', userId);
    console.log('Happy Coins from metadata:', happyCoins);
    console.log('Payment status:', session.payment_status);
    console.log('Full metadata:', session.metadata);

    if (session.payment_status !== 'paid') {
      console.log('Payment not completed yet, status:', session.payment_status);
      return new Response(JSON.stringify({ 
        received: true, 
        message: 'Payment not completed yet' 
      }), { status: 200 });
    }

    if (!userId || !happyCoins || happyCoins <= 0) {
      console.log('Missing or invalid metadata - userId:', userId, 'happyCoins:', happyCoins);
      return new Response(JSON.stringify({ 
        received: true, 
        error: 'Invalid session metadata',
        metadata: session.metadata 
      }), { status: 200 });
    }

    try {
      // Check if this payment has already been processed
      const { data: existingTransaction, error: transactionCheckError } = await supabaseClient
        .from('transactions')
        .select('id')
        .eq('reference_id', session.id)
        .single();

      if (existingTransaction) {
        console.log('Payment already processed:', session.id);
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'Payment already processed',
          transaction_id: existingTransaction.id 
        }), { status: 200 });
      }

      // Get user's wallet
      console.log('Looking for wallet for user:', userId);
      let wallet;
      const { data: walletData, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError) {
        console.error('Wallet error:', walletError);
        
        // Try to create wallet if it doesn't exist
        if (walletError.code === 'PGRST116') {
          console.log('Creating new wallet for user:', userId);
          const { data: newWallet, error: createError } = await supabaseClient
            .from('wallets')
            .insert({
              user_id: userId,
              balance: 0,
              currency: 'USD'
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Failed to create wallet:', createError);
            throw createError;
          }
          
          console.log('New wallet created:', newWallet.id);
          wallet = newWallet;
        } else {
          throw walletError;
        }
      } else {
        wallet = walletData;
      }

      console.log('Current wallet balance:', wallet.balance);

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance.toString()) + happyCoins;
      console.log('Updating balance from', wallet.balance, 'to', newBalance);
      
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

      console.log('Balance updated successfully to:', newBalance);

      // Create transaction record
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          transaction_type: 'credit',
          amount: happyCoins,
          description: `Purchase of ${happyCoins} Happy Coins via Stripe`,
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

      console.log(`Successfully processed payment for user ${userId}: ${happyCoins} HC`);
      
      return new Response(JSON.stringify({ 
        received: true, 
        processed: true,
        user_id: userId,
        coins_added: happyCoins,
        new_balance: newBalance
      }), { status: 200 });
      
    } catch (error) {
      console.error('Error processing payment:', error);
      return new Response(JSON.stringify({ 
        received: true,
        error: 'Payment processing failed', 
        details: error.message 
      }), { status: 200 });
    }
  } else {
    console.log('Received event type:', receivedEvent.type, '- not processing');
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
