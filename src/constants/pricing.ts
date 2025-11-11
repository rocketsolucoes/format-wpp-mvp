/**
 * Pricing Constants
 *
 * Centralized pricing configuration for the application.
 * ALL pricing references should use these constants to ensure consistency.
 *
 * IMPORTANT: When changing prices, update these values and they will
 * automatically reflect across the entire application.
 */

export const PRICING = {
  /**
   * Pro Plan Pricing
   */
  PRO_MONTHLY_PRICE: 19.90,
  PRO_ANNUAL_MONTHLY_PRICE: 16.58,
  PRO_ANNUAL_TOTAL_PRICE: 199.00,

  /**
   * Free Plan
   */
  FREE_MONTHLY_CREDITS: 30,
  FREE_HISTORY_DAYS: 7,

  /**
   * Stripe Price IDs
   * These must match the price IDs in your Stripe dashboard
   */
  STRIPE_PRICE_ID_MONTHLY: 'price_1SPu4QRsqRrcMrSPgJwd8a2j',
  STRIPE_PRICE_ID_ANNUAL: 'price_1SPu4jRsqRrcMrSP2M2b5POX',
} as const;

/**
 * Currency formatting helper
 */
export const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Calculate annual savings
 */
export const calculateAnnualSavings = (): number => {
  return (PRICING.PRO_MONTHLY_PRICE * 12) - PRICING.PRO_ANNUAL_TOTAL_PRICE;
};
