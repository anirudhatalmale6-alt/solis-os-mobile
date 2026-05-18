-- Solis OS - Database Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)

-- Add logo_url column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  items JSONB DEFAULT '[]',
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new invoice columns (v1.1.8)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for authenticated and anon users
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);

-- Allow logo_url updates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'Allow all on businesses') THEN
    CREATE POLICY "Allow all on businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Storage: Allow public read on logos bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 'Public read logos', 'logos', 'SELECT', 'true', 'true'
WHERE NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'Public read logos');

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 'Auth upload logos', 'logos', 'INSERT', 'true', 'true'
WHERE NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'Auth upload logos');
