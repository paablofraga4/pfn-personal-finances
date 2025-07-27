-- Database Setup for Personal Finance Hub
-- Execute this in Supabase SQL Editor

-- 1. Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  last_four_digits TEXT NOT NULL,
  color TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  limit_amount DECIMAL(10,2) DEFAULT 0,
  purpose TEXT DEFAULT 'otros',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- 2. Create monthly_expenses table
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  card_id UUID REFERENCES cards(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_id ON monthly_expenses(user_id);

-- 3. Verify tables exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('cards', 'monthly_expenses', 'transactions', 'savings_goals')
ORDER BY table_name, ordinal_position; 