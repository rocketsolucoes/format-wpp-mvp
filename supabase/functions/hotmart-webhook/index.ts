import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hotmart Webhook Handler
 *
 * Receives webhook notifications from Hotmart and updates the database accordingly.
 * Handles events like: purchase completion, subscription cancellation, refunds, etc.
 */

interface HotmartWebhookEvent {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      name: string;
      ucode?: string;
    };
    buyer: {
      email: string;
      name: string;
      checkout_phone?: string;
    };
    purchase: {
      transaction: string;
      status: string;
      approved_date?: number;
      order_date?: number;
      price?: {
        value: number;
        currency_code: string;
      };
      payment?: {
        type: string;
      };
      offer?: {
        code: string;
      };
    };
    subscription?: {
      subscriber_code: string;
      plan?: {
        id: number;
        name: string;
      };
      status: string;
      date_next_charge?: {
        date: number;
      };
      date_subscription_start?: {
        date: number;
      };
      date_subscription_end?: {
        date: number;
      };
      recurrency_period?: number;
      subscription_id?: string;
    };
    affiliates?: any[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse webhook payload
    const webhookEvent: HotmartWebhookEvent = await req.json();

    console.log('Received Hotmart webhook:', {
      event: webhookEvent.event,
      transaction: webhookEvent.data.purchase?.transaction,
      subscriberCode: webhookEvent.data.subscription?.subscriber_code,
    });

    // Extract common data
    const buyerEmail = webhookEvent.data.buyer.email;
    const buyerName = webhookEvent.data.buyer.name;
    const productId = String(webhookEvent.data.product.id);
    const productName = webhookEvent.data.product.name;

    // Find user by email
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Failed to list users: ${authError.message}`);
    }

    const user = authUser.users.find(u => u.email === buyerEmail);
    if (!user) {
      console.error(`User not found with email: ${buyerEmail}`);
      return new Response(
        JSON.stringify({ error: 'User not found', email: buyerEmail }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different event types
    switch (webhookEvent.event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
        await handlePurchaseComplete(supabaseClient, user.id, webhookEvent);
        break;

      case 'SUBSCRIPTION_CANCELLATION':
      case 'PURCHASE_CANCELED':
        await handleSubscriptionCancellation(supabaseClient, user.id, webhookEvent);
        break;

      case 'PURCHASE_REFUNDED':
        await handleRefund(supabaseClient, user.id, webhookEvent);
        break;

      case 'SUBSCRIPTION_REACTIVATION':
        await handleSubscriptionReactivation(supabaseClient, user.id, webhookEvent);
        break;

      default:
        console.log(`Unhandled event type: ${webhookEvent.event}`);
    }

    return new Response(
      JSON.stringify({ success: true, event: webhookEvent.event }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle purchase completion - activate subscription
 */
async function handlePurchaseComplete(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  const { data, purchase, subscription } = event.data;
  const subscriberCode = subscription?.subscriber_code || event.id;
  const buyerEmail = data.buyer.email;

  // 1. Create or update hotmart_customer
  const { data: existingCustomer, error: customerFetchError } = await supabaseClient
    .from('hotmart_customers')
    .select('id')
    .eq('user_id', userId)
    .single();

  let customerId: number;

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabaseClient
      .from('hotmart_customers')
      .insert({
        user_id: userId,
        subscriber_code: subscriberCode,
        email: buyerEmail,
      })
      .select('id')
      .single();

    if (customerError) throw new Error(`Failed to create customer: ${customerError.message}`);
    customerId = newCustomer.id;
  }

  // 2. Create or update subscription
  if (subscription) {
    const subscriptionData = {
      customer_id: customerId,
      subscription_id: subscription.subscription_id || subscriberCode,
      plan_id: String(subscription.plan?.id || data.product.id),
      status: 'active',
      date_next_charge: subscription.date_next_charge?.date
        ? new Date(subscription.date_next_charge.date * 1000).toISOString()
        : null,
      date_subscription_start: subscription.date_subscription_start?.date
        ? new Date(subscription.date_subscription_start.date * 1000).toISOString()
        : new Date().toISOString(),
      date_subscription_end: subscription.date_subscription_end?.date
        ? new Date(subscription.date_subscription_end.date * 1000).toISOString()
        : null,
      recurrency_period: subscription.recurrency_period || 30,
    };

    const { error: subError } = await supabaseClient
      .from('hotmart_subscriptions')
      .upsert(subscriptionData, { onConflict: 'subscription_id' });

    if (subError) throw new Error(`Failed to upsert subscription: ${subError.message}`);
  }

  // 3. Record transaction
  const transactionData = {
    customer_id: customerId,
    transaction: purchase.transaction,
    purchase_date: purchase.approved_date || purchase.order_date
      ? new Date((purchase.approved_date || purchase.order_date)! * 1000).toISOString()
      : new Date().toISOString(),
    product_id: String(data.product.id),
    product_name: data.product.name,
    offer_code: purchase.offer?.code || null,
    amount_total: purchase.price?.value || 0,
    currency: purchase.price?.currency_code || 'BRL',
    status: 'approved',
    payment_type: purchase.payment?.type || null,
  };

  const { error: txError } = await supabaseClient
    .from('hotmart_transactions')
    .upsert(transactionData, { onConflict: 'transaction' });

  if (txError) throw new Error(`Failed to record transaction: ${txError.message}`);

  // 4. Update user profile to Pro plan
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      plan: 'pro',
      subscription_status: 'active',
      subscription_tier: 'pro',
    })
    .eq('id', userId);

  if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

  console.log(`Successfully activated subscription for user ${userId}`);
}

/**
 * Handle subscription cancellation - downgrade to free
 */
async function handleSubscriptionCancellation(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  const subscriberCode = event.data.subscription?.subscriber_code || event.id;

  // 1. Update subscription status
  const { error: subError } = await supabaseClient
    .from('hotmart_subscriptions')
    .update({ status: 'canceled' })
    .eq('subscription_id', subscriberCode);

  if (subError) console.error('Failed to update subscription:', subError);

  // 2. Update user profile to free plan
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      subscription_tier: 'free',
      credits_remaining: 30, // Reset to free tier credits
    })
    .eq('id', userId);

  if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

  console.log(`Successfully canceled subscription for user ${userId}`);
}

/**
 * Handle refund - cancel access immediately
 */
async function handleRefund(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  const transaction = event.data.purchase.transaction;

  // 1. Update transaction status
  const { error: txError } = await supabaseClient
    .from('hotmart_transactions')
    .update({ status: 'refunded' })
    .eq('transaction', transaction);

  if (txError) console.error('Failed to update transaction:', txError);

  // 2. Cancel subscription and downgrade user
  await handleSubscriptionCancellation(supabaseClient, userId, event);

  console.log(`Successfully processed refund for user ${userId}`);
}

/**
 * Handle subscription reactivation - restore Pro access
 */
async function handleSubscriptionReactivation(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  // Treat reactivation the same as a new purchase
  await handlePurchaseComplete(supabaseClient, userId, event);
  console.log(`Successfully reactivated subscription for user ${userId}`);
}
