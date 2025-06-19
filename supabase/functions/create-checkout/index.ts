
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { amount, paymentMethod = 'card' } = await req.json();
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    console.log('Creating checkout for:', user.email, 'amount:', amount, 'HC');

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Convert Happy Coins to INR (1 HC = 1000 INR)
    const amountInINR = amount * 1000;

    // Configure payment method types based on selection
    const paymentMethodTypes = paymentMethod === 'upi' ? ['card'] : ['card'];

    console.log('Creating Stripe session with amount:', amountInINR, 'INR for', amount, 'HC');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { 
              name: `${amount} Happy Coins`,
              description: paymentMethod === 'upi' ? 'Payment via UPI method' : 'Payment via Card'
            },
            unit_amount: amountInINR * 100, // Convert to paise (INR cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?success=true`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
      metadata: {
        user_id: user.id,
        happy_coins: amount.toString(),
        payment_method: paymentMethod,
      },
    });

    console.log('Stripe session created:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
