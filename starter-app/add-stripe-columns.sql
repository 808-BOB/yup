-- Add Stripe Integration Columns to Users Table
-- Run this in Supabase SQL Editor

-- Add Stripe-related columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON users(stripe_subscription_id);

-- Verify the columns were added
SELECT 'Stripe columns added successfully!' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id')
ORDER BY column_name; 