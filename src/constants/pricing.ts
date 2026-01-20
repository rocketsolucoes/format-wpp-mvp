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
   * Annual plan offers approximately 8.4% discount off monthly price
   */
  PRO_MONTHLY_PRICE: 24.90,
  PRO_ANNUAL_MONTHLY_PRICE: 22.825, // 273.90 / 12
  PRO_ANNUAL_TOTAL_PRICE: 273.90,

  /**
   * Free Plan
   */
  FREE_MONTHLY_CREDITS: 10,
  FREE_HISTORY_DAYS: 0,

  /**
   * Hotmart Checkout Links
   * These are the direct checkout URLs from Hotmart
   */
  HOTMART_CHECKOUT_LINK_MONTHLY: 'https://pay.hotmart.com/K103847879P',
  HOTMART_CHECKOUT_LINK_ANNUAL: 'https://pay.hotmart.com/K103847879P?off=b82pumii',
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
