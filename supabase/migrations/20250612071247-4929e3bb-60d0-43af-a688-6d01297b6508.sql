
-- Update RLS policies for wallets table to allow transfers between users
-- Users need to be able to read recipient wallets for transfers

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;

-- Create new policies that allow reading any wallet (needed for transfers) but restrict updates to own wallet
CREATE POLICY "Users can view any wallet for transfers" ON public.wallets
  FOR SELECT USING (true);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- For transactions table, update policies to allow viewing transactions where user is sender or recipient
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view related transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
