
-- Fix the transactions table RLS policy for transfers
-- Drop the current policy that has incorrect logic
DROP POLICY IF EXISTS "Users can insert transactions for transfers" ON public.transactions;

-- Create a corrected policy that allows:
-- 1. Users to insert their own transactions (where auth.uid() = user_id)
-- 2. Users to insert transfer_in records for recipients when they are the sender
CREATE POLICY "Users can insert transactions for transfers" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (transaction_type = 'transfer_in' AND auth.uid() = recipient_id)
  );
