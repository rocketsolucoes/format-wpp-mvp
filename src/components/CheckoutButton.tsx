import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../hooks/useAnalytics';
import { createCheckoutSession } from '../services/checkout';

interface CheckoutButtonProps {
  checkoutLink: string;
  planName: string;
  isCurrentPlan?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export default function CheckoutButton({
  checkoutLink,
  planName,
  isCurrentPlan = false,
  children,
  variant = 'default',
  className = '',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleClick = async () => {
    if (!user) {
      trackEvent('checkout_login_required', {
        plan: planName.toLowerCase(),
        event_category: 'conversion',
        event_label: 'checkout_redirect_auth'
      });
      setLocation('/auth');
      return;
    }

    if (isCurrentPlan) {
      return;
    }

    // Rastrear início do checkout
    trackEvent('begin_checkout', {
      plan: planName.toLowerCase(),
      event_category: 'ecommerce',
      event_label: 'checkout_initiated'
    });

    setLoading(true);

    try {
      const { url } = await createCheckoutSession(checkoutLink);

      // Rastrear redirecionamento para checkout externo
      trackEvent('checkout_redirect', {
        plan: planName.toLowerCase(),
        provider: 'hotmart',
        event_category: 'ecommerce',
        event_label: 'hotmart_checkout_redirect'
      });

      window.location.href = url;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento. Por favor, tente novamente.';
      alert(errorMessage);
      setLoading(false);
    }
  };

  if (isCurrentPlan) {
    return (
      <Button
        variant={variant}
        className={className}
        disabled
      >
        Plano Atual
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={className}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
