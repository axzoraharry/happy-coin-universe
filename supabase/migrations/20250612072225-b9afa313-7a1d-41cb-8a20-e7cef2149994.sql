
-- Fix wallet RLS policies to ensure transfers can update wallet balances
-- The current policy only allows users to update their own wallets
-- but for transfers, the sender needs to update both wallets

-- Drop the existing wallet update policy
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Create a new policy that allows:
-- 1. Users to update their own wallet
-- 2. Users to update recipient wallets when making transfers (we'll handle this in code with proper validation)
CREATE POLICY "Users can update wallets for transfers" ON public.wallets
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    -- Allow wallet updates for transfers by checking if there's a valid transfer transaction
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.wallet_id = wallets.id 
      AND t.user_id = auth.uid() 
      AND t.transaction_type IN ('transfer_out', 'transfer_in')
      AND t.status = 'completed'
      AND t.created_at > NOW() - INTERVAL '1 minute'
    )
  );
