import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const requestBody = await req.json();
    console.log("Received request:", { priceId: requestBody.priceId });

    const { priceId, successUrl, cancelUrl }: CheckoutRequest = requestBody;

    if (!priceId || !successUrl || !cancelUrl) {
      throw new Error("Missing required fields: priceId, successUrl, cancelUrl");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe configuration error. Please contact support.");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("Verifying user...");
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "apikey": supabaseServiceKey || "",
      },
    });

    if (!userResponse.ok) {
      console.error("User verification failed:", userResponse.status);
      throw new Error("Invalid user token");
    }

    const user = await userResponse.json();
    console.log("User verified:", user.id);

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=*`,
      {
        headers: {
          "apikey": supabaseServiceKey || "",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const profileData = await profileResponse.json();
    const customerEmail = profileData?.[0]?.email || user.email;

    console.log("Creating Stripe checkout session...", { priceId, customerEmail });

    const checkoutSession = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "mode": "subscription",
        "currency": "brl",
        "success_url": successUrl,
        "cancel_url": cancelUrl,
        "customer_email": customerEmail,
        "client_reference_id": user.id,
        "metadata[user_id]": user.id,
      }).toString(),
    });

    if (!checkoutSession.ok) {
      const errorText = await checkoutSession.text();
      console.error("Stripe API error:", errorText);
      throw new Error(`Stripe API error: ${checkoutSession.statusText}`);
    }

    const session = await checkoutSession.json();
    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});