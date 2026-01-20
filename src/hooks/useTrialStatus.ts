import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import type { TrialInfo } from '../types/trial';
import { PRICING } from '../constants/pricing';

/**
 * Hook to manage trial status and information
 * 
 * Monitors the user's trial status and provides:
 * - Days/hours left in trial
 * - Trial expiration date
 * - Auto-downgrade when trial expires
 */
export function useTrialStatus() {
  const { user, refreshUser } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const checkTrial = async () => {
      // 🛡️ REGRA DE OURO: Usuários com assinatura ativa NUNCA veem trial
      // Isso garante que usuários pagantes tenham experiência 100% limpa
      if (user.subscription_status === 'active') {
        setTrialInfo(null);
        setIsLoading(false);
        return;
      }

      // Only process if trial is active
      if (user.trial_status === 'active' && user.trial_end_date) {
        const endDate = new Date(user.trial_end_date);
        const startDate = user.trial_start_date ? new Date(user.trial_start_date) : new Date();
        const now = new Date();
        
        const timeLeft = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

        // Trial expired - trigger downgrade
        if (timeLeft <= 0) {
          await handleTrialExpired();
        } else {
          setTrialInfo({
            isActive: true,
            daysLeft: Math.max(0, daysLeft),
            hoursLeft: Math.max(0, hoursLeft),
            endDate,
            startDate,
            status: 'active',
          });
        }
      } else {
        setTrialInfo(null);
      }
      
      setIsLoading(false);
    };

    const handleTrialExpired = async () => {
      if (!user) return;

      try {
        // Update profile to expired trial and downgrade to free
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            subscription_tier: 'free',
            trial_status: 'expired',
            credits_remaining: PRICING.FREE_MONTHLY_CREDITS,
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error expiring trial:', error);
          return;
        }

        // Refresh profile to update UI
        await refreshUser?.();

        // Update local state
        setTrialInfo({
          isActive: false,
          daysLeft: 0,
          hoursLeft: 0,
          endDate: new Date(),
          startDate: new Date(),
          status: 'expired',
        });
      } catch (error) {
        console.error('Error handling trial expiration:', error);
      }
    };

    checkTrial();

    // Check every minute for expiration
    const interval = setInterval(checkTrial, 60000);

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  return { trialInfo, isLoading };
}
