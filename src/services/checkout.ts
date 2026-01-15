import { supabase } from '../lib/supabase';

export interface CheckoutSessionResponse {
  url: string;
}

/**
 * Creates a Hotmart checkout URL with user information
 * @param checkoutLink - Base Hotmart checkout link
 * @returns Checkout URL with user parameters
 */
export async function createCheckoutSession(checkoutLink: string): Promise<CheckoutSessionResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    // Get user email
    const userEmail = session.user.email;

    if (!userEmail) {
      throw new Error('Email do usuário não disponível');
    }

    // Build Hotmart checkout URL with parameters
    const url = new URL(checkoutLink);
    url.searchParams.set('email', userEmail);
    
    // Add redirect URL for post-purchase
    const redirectUrl = `${window.location.origin}/thank-you`;
    url.searchParams.set('redirect_to', redirectUrl);

    // Optional: Add user name if available
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();

    if (profile?.full_name) {
      url.searchParams.set('name', profile.full_name);
    }

    return {
      url: url.toString(),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}
