import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';

export default function TestStripe() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCheckout = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setResult({ error: 'No session found. Please login first.' });
        setLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;

      console.log('Testing with:', {
        apiUrl,
        hasToken: !!session.access_token,
        tokenPreview: session.access_token.substring(0, 20) + '...'
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: 'price_1SPu4QRsqRrcMrSPgJwd8a2j',
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { rawText: responseText };
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      });

    } catch (error) {
      console.error('Test error:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-slate-800 mb-6">
          <CardHeader>
            <CardTitle>Stripe Checkout Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testCheckout} disabled={loading}>
              {loading ? 'Testing...' : 'Test Checkout API'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-slate-800">
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-800 mt-6">
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 p-4 rounded text-xs">
              {JSON.stringify({
                VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
                VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Set (pk_test_...)' : 'Not set',
                hasSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
