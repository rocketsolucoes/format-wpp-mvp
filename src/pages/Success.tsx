import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { trackEvent } from '../hooks/useAnalytics';
import confetti from 'canvas-confetti';

export default function Success() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  // Rastrear conversão de pagamento (apenas uma vez ao carregar a página)
  useEffect(() => {
    trackEvent('purchase', {
      transaction_id: `txn_${Date.now()}`,
      value: 0, // Valor seria passado via URL params em produção
      currency: 'BRL',
      event_category: 'ecommerce',
      event_label: 'purchase_complete'
    });

    // Evento adicional de conversão
    trackEvent('conversion', {
      conversion_type: 'purchase',
      plan: 'pro',
      event_category: 'conversion',
      event_label: 'paid_plan_activated'
    });
  }, []);

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setLocation('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  const benefits = [
    'Unlimited formatting operations',
    'Advanced AI formatting',
    'Complete history access',
    'Custom style library',
    'Ready-made templates',
    'Priority support',
    'No ads',
    'Export to PDF',
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-border">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-foreground" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Payment Confirmed!
          </h1>

          <p className="text-xl text-muted-foreground mb-8">
            Your Pro plan has been successfully activated
          </p>

          <div className="bg-card/50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              You now have access to:
            </h2>
            <ul className="space-y-3 text-left max-w-md mx-auto">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={() => setLocation('/dashboard')}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 mb-4"
          >
            Go to Dashboard
          </Button>

          <p className="text-sm text-muted-foreground">
            Redirecting automatically in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
