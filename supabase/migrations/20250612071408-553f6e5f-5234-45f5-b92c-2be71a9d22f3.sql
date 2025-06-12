
-- Update the transactions table RLS policy to allow transfers
-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

-- Create a new policy that allows:
-- 1. Users to insert their own transactions
-- 2. Users to insert transaction records for recipients when they are the sender (for transfers)
CREATE POLICY "Users can insert transactions for transfers" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (transaction_type IN ('transfer_in', 'transfer_out') AND auth.uid() = recipient_id)
  );
