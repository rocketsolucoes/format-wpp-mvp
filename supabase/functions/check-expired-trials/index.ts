import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: check-expired-trials
 * 
 * Checks for expired trials and downgrades users to free plan.
 * Should be run periodically (e.g., every hour) via cron job.
 * 
 * Process:
 * 1. Find all active trials that have expired
 * 2. Downgrade each user to free plan
 * 3. Update trial status to 'expired'
 * 4. Reset credits to 30 (free tier)
 */

interface ExpiredTrial {
  id: string;
  email: string;
  full_name: string | null;
  trial_end_date: string;
}

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
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

    console.log('🔍 Checking for expired trials...');

    // Find all active trials that have expired
    const { data: expiredTrials, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, trial_end_date')
      .eq('trial_status', 'active')
      .lt('trial_end_date', new Date().toISOString())
      .is('subscription_status', null); // Only users without paid subscription

    if (fetchError) {
      console.error('❌ Error fetching expired trials:', fetchError);
      throw fetchError;
    }

    const count = expiredTrials?.length || 0;
    console.log(`📊 Found ${count} expired trial(s)`);

    if (count === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No expired trials found',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Process each expired trial
    const results = [];
    for (const profile of expiredTrials as ExpiredTrial[]) {
      try {
        // Downgrade to free plan
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            plan: 'free',
            subscription_tier: 'free',
            trial_status: 'expired',
            credits_remaining: 30,
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ Error updating profile ${profile.id}:`, updateError);
          results.push({
            id: profile.id,
            email: profile.email,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`✅ Expired trial for: ${profile.email}`);
          results.push({
            id: profile.id,
            email: profile.email,
            success: true,
          });
        }
      } catch (error) {
        console.error(`❌ Exception processing ${profile.id}:`, error);
        results.push({
          id: profile.id,
          email: profile.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`✅ Successfully processed: ${successCount}`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: count,
        successful: successCount,
        failed: failCount,
        results,
        message: `Processed ${count} expired trial(s): ${successCount} successful, ${failCount} failed`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
