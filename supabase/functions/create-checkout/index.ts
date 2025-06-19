
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
    console.log("Create checkout function called");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    console.log("Creating checkout for:", user.email, "ID:", user.id);

    const { amount, paymentMethod } = await req.json();
    console.log("Amount:", amount, "Payment method:", paymentMethod);

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Convert amount to cents (1 HC = 1000 INR = 1000 * 100 = 100000 paise)
    const amountInCents = amount * 100000;
    console.log("Creating Stripe session with amount:", amountInCents, "INR for", amount, "HC");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'upi' ? ['card'] : ['card'], // UPI not directly supported in test mode
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${amount} Happy Coins`,
              description: `Purchase ${amount} Happy Coins for your wallet`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/?success=true`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/?canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        happy_coins: amount.toString(),
        payment_method: paymentMethod || 'card',
      },
    });

    console.log("Stripe session created:", session.id);
    console.log("Session metadata:", session.metadata);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
