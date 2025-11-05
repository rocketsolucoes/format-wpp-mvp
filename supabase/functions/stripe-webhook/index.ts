import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeWebhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("Webhook secret not configured");
    }

    if (!signature) {
      throw new Error("No stripe signature found");
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const body = await req.text();
    
    const webhookPayload = {
      signature,
      body,
      secret: stripeWebhookSecret,
    };

    const verifyResponse = await fetch("https://api.stripe.com/v1/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "type": "webhook_endpoint.verify",
      }).toString(),
    });

    const event = JSON.parse(body);
    console.log("Webhook event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout completed:", session.id);

        const customerId = session.customer;
        const userId = session.client_reference_id || session.metadata?.user_id;

        if (!userId) {
          console.error("No user ID found in session");
          break;
        }

        const { error: customerError } = await supabase
          .from("stripe_customers")
          .upsert({
            user_id: userId,
            customer_id: customerId,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (customerError) {
          console.error("Error upserting customer:", customerError);
          throw customerError;
        }

        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = session.subscription;
          
          const subscriptionResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            {
              headers: {
                "Authorization": `Bearer ${stripeSecretKey}`,
              },
            }
          );

          const subscription = await subscriptionResponse.json();
          console.log("Fetched subscription:", subscription.id);

          const { error: subscriptionError } = await supabase
            .from("stripe_subscriptions")
            .upsert({
              customer_id: customerId,
              subscription_id: subscription.id,
              price_id: subscription.items.data[0].price.id,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
              status: subscription.status,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "customer_id",
            });

          if (subscriptionError) {
            console.error("Error upserting subscription:", subscriptionError);
            throw subscriptionError;
          }

          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_tier: "pro",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }
        }

        if (session.payment_intent) {
          const { error: orderError } = await supabase
            .from("stripe_orders")
            .insert({
              checkout_session_id: session.id,
              payment_intent_id: session.payment_intent,
              customer_id: customerId,
              amount_subtotal: session.amount_subtotal || 0,
              amount_total: session.amount_total || 0,
              currency: session.currency || "usd",
              payment_status: session.payment_status,
              status: "completed",
            });

          if (orderError) {
            console.error("Error inserting order:", orderError);
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("Subscription updated:", subscription.id);

        const { error: subscriptionError } = await supabase
          .from("stripe_subscriptions")
          .update({
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            price_id: subscription.items.data[0].price.id,
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscription.id);

        if (subscriptionError) {
          console.error("Error updating subscription:", subscriptionError);
          throw subscriptionError;
        }

        const { data: customerData } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("customer_id", subscription.customer)
          .single();

        if (customerData) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_tier: subscription.status === "active" ? "pro" : "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", customerData.user_id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("Subscription deleted:", subscription.id);

        const { error: subscriptionError } = await supabase
          .from("stripe_subscriptions")
          .update({
            status: "canceled",
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscription.id);

        if (subscriptionError) {
          console.error("Error deleting subscription:", subscriptionError);
        }

        const { data: customerData } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("customer_id", subscription.customer)
          .single();

        if (customerData) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "canceled",
              subscription_tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", customerData.user_id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log("Payment succeeded:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("Payment failed:", invoice.id);

        const { data: customerData } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("customer_id", invoice.customer)
          .single();

        if (customerData) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", customerData.user_id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Webhook processing failed",
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