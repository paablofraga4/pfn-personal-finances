-- Complete Database Setup for Personal Finance Hub
-- Execute this in your new Supabase project SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  gross_amount DECIMAL(10,2),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  card_id UUID,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  last_four_digits TEXT NOT NULL,
  color TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  limit_amount DECIMAL(10,2) DEFAULT 0,
  purpose TEXT DEFAULT 'otros' CHECK (purpose IN ('gastos_corrientes', 'dolares', 'gastos_mensuales', 'otros')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create monthly_expenses table
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);

CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_id ON monthly_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_active ON monthly_expenses(is_active);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);

-- Add foreign key constraints
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_card_id 
FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Cards policies
CREATE POLICY "Users can view their own cards" ON cards
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own cards" ON cards
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own cards" ON cards
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own cards" ON cards
  FOR DELETE USING (auth.uid()::text = user_id);

-- Monthly expenses policies
CREATE POLICY "Users can view their own monthly expenses" ON monthly_expenses
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own monthly expenses" ON monthly_expenses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own monthly expenses" ON monthly_expenses
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own monthly expenses" ON monthly_expenses
  FOR DELETE USING (auth.uid()::text = user_id);

-- Savings goals policies
CREATE POLICY "Users can view their own savings goals" ON savings_goals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own savings goals" ON savings_goals
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own savings goals" ON savings_goals
  FOR DELETE USING (auth.uid()::text = user_id);

-- Verify all tables were created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('transactions', 'cards', 'monthly_expenses', 'savings_goals')
ORDER BY table_name, ordinal_position; 