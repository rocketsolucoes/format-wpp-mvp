import { supabase } from '../lib/supabase';

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(priceId: string): Promise<CheckoutSessionResponse> {
  try {
    const origin = window.location.origin;
    const successUrl = `${origin}/success`;
    const cancelUrl = `${origin}/cancel`;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Checkout session error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error || error.message || 'Falha ao criar sessão de pagamento');
      } catch (e) {
        throw new Error(`Falha ao criar sessão de pagamento: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error('URL de pagamento não recebida');
    }

    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}
