import React from 'react';
import { useLocation } from 'wouter';
import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Cancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-slate-800">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-white">
            Payment Canceled
          </h1>

          <p className="text-xl text-slate-300 mb-8">
            Don't worry, you can try again anytime
          </p>

          <div className="bg-slate-900/50 rounded-lg p-6 mb-8">
            <p className="text-slate-400">
              Your payment was not processed. No charges have been made to your account.
              Feel free to review our plans and try again when you're ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/pricing')}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
            >
              View Plans
            </Button>
            <Button
              onClick={() => setLocation('/')}
              size="lg"
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
