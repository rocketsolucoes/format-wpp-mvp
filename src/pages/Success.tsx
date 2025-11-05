import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import confetti from 'canvas-confetti';

export default function Success() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

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
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-slate-800">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Payment Confirmed!
          </h1>

          <p className="text-xl text-slate-300 mb-8">
            Your Pro plan has been successfully activated
          </p>

          <div className="bg-slate-900/50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">
              You now have access to:
            </h2>
            <ul className="space-y-3 text-left max-w-md mx-auto">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{benefit}</span>
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

          <p className="text-sm text-slate-400">
            Redirecting automatically in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
