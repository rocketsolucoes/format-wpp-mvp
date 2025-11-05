import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { createCheckoutSession } from '../services/checkout';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
  isCurrentPlan?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export default function CheckoutButton({
  priceId,
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
      setLocation('/auth');
      return;
    }

    if (isCurrentPlan) {
      return;
    }

    setLoading(true);

    try {
      const { url } = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error processing payment. Please try again.';
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
        Current Plan
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
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
