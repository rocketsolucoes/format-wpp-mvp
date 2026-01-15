/*
  # Remove Stripe Integration Structure

  This migration removes all Stripe-related tables, views, types and policies
  as part of the migration to Hotmart payment processing.

  ## What will be removed:
  - Views: stripe_user_subscriptions, stripe_user_orders
  - Tables: stripe_orders, stripe_subscriptions, stripe_customers
  - Types: stripe_subscription_status, stripe_order_status
*/

-- Drop views first (dependent objects)
DROP VIEW IF EXISTS stripe_user_orders;
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Drop tables (with CASCADE to remove dependent objects)
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS stripe_order_status;
DROP TYPE IF EXISTS stripe_subscription_status;

-- Note: We keep the profiles table intact as it will be adapted for Hotmart
