import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * TrialBadge Component
 *
 * Small badge to indicate user is on trial.
 * Shows "Trial Pro" with sparkles icon.
 *
 * 🛡️ RULE: Never shown to users with active subscription
 */
export function TrialBadge() {
  const { user } = useAuth();

  // Don't show if no user
  if (!user) return null;

  // 🛡️ Never show trial badge to paying customers
  if (user.subscription_status === 'active') return null;

  // Only show if trial is active
  if (user.trial_status !== 'active') return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <Sparkles className="w-3 h-3" />
      Trial Pro
    </div>
  );
}
