-- Create Happy Paisa (HP) tables and Stellar integration
-- HP is pegged at 1 HP = 1000 INR

-- Happy Paisa accounts (Stellar-based)
CREATE TABLE public.happy_paisa_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stellar_address TEXT NOT NULL UNIQUE,
  stellar_secret_encrypted TEXT NOT NULL, -- Encrypted stellar secret key
  hp_balance DECIMAL(15,6) NOT NULL DEFAULT 0.00,
  inr_equivalent DECIMAL(15,2) GENERATED ALWAYS AS (hp_balance * 1000) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- HP transaction history (Stellar-synced)
CREATE TABLE public.hp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stellar_transaction_id TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('send', 'receive', 'buy_hp', 'sell_hp', 'conversion')),
  hp_amount DECIMAL(15,6) NOT NULL,
  inr_amount DECIMAL(15,2),
  fee_hp DECIMAL(15,6) DEFAULT 0.000001, -- Stellar network fee
  from_address TEXT,
  to_address TEXT,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stellar_ledger BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- HP conversion rates and history
CREATE TABLE public.hp_conversion_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hp_to_inr_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00, -- Fixed peg
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stellar network configuration
CREATE TABLE public.stellar_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network_name TEXT NOT NULL DEFAULT 'testnet',
  horizon_url TEXT NOT NULL DEFAULT 'https://horizon-testnet.stellar.org',
  asset_code TEXT NOT NULL DEFAULT 'HP',
  asset_issuer TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI automation preferences
CREATE TABLE public.ai_automation_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  auto_categorization BOOLEAN NOT NULL DEFAULT true,
  fraud_detection BOOLEAN NOT NULL DEFAULT true,
  spending_alerts BOOLEAN NOT NULL DEFAULT true,
  savings_recommendations BOOLEAN NOT NULL DEFAULT true,
  voice_assistant BOOLEAN NOT NULL DEFAULT true,
  automation_level TEXT NOT NULL DEFAULT 'standard' CHECK (automation_level IN ('minimal', 'standard', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- n8n workflow integration
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('bill_payment', 'savings_transfer', 'expense_categorization', 'custom')),
  n8n_workflow_id TEXT,
  trigger_conditions JSONB,
  actions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_executed TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced virtual card features
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS merchant_restrictions JSONB;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS ai_fraud_protection BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_hp_accounts_user_id ON public.happy_paisa_accounts(user_id);
CREATE INDEX idx_hp_accounts_stellar_address ON public.happy_paisa_accounts(stellar_address);
CREATE INDEX idx_hp_transactions_user_id ON public.hp_transactions(user_id);
CREATE INDEX idx_hp_transactions_stellar_id ON public.hp_transactions(stellar_transaction_id);
CREATE INDEX idx_hp_transactions_created_at ON public.hp_transactions(created_at DESC);
CREATE INDEX idx_automation_workflows_user_id ON public.automation_workflows(user_id);
CREATE INDEX idx_ai_automation_user_id ON public.ai_automation_preferences(user_id);

-- Enable RLS on all new tables
ALTER TABLE public.happy_paisa_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hp_conversion_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stellar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_automation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

-- RLS policies for Happy Paisa accounts
CREATE POLICY "Users can view their own HP accounts" 
ON public.happy_paisa_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HP accounts" 
ON public.happy_paisa_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own HP accounts" 
ON public.happy_paisa_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for HP transactions
CREATE POLICY "Users can view their own HP transactions" 
ON public.hp_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HP transactions" 
ON public.hp_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for conversion rates (read-only for users)
CREATE POLICY "Conversion rates are viewable by everyone" 
ON public.hp_conversion_rates 
FOR SELECT 
USING (true);

-- RLS policies for Stellar config (read-only for users)
CREATE POLICY "Stellar config is viewable by everyone" 
ON public.stellar_config 
FOR SELECT 
USING (true);

-- RLS policies for AI automation preferences
CREATE POLICY "Users can manage their own automation preferences" 
ON public.ai_automation_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for automation workflows
CREATE POLICY "Users can manage their own workflows" 
ON public.automation_workflows 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Insert default Stellar configuration
INSERT INTO public.stellar_config (network_name, horizon_url, asset_code, asset_issuer) 
VALUES ('testnet', 'https://horizon-testnet.stellar.org', 'HP', NULL);

-- Insert default HP conversion rate
INSERT INTO public.hp_conversion_rates (hp_to_inr_rate) VALUES (1000.00);

-- Create function to initialize HP account for new users
CREATE OR REPLACE FUNCTION public.initialize_hp_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize AI automation preferences
  INSERT INTO public.ai_automation_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user HP account initialization
CREATE TRIGGER initialize_hp_account_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.initialize_hp_account();