
-- Create a function to process wallet transfers atomically
CREATE OR REPLACE FUNCTION public.process_wallet_transfer(
  sender_id UUID,
  recipient_id UUID,
  transfer_amount DECIMAL,
  transfer_description TEXT DEFAULT 'Transfer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_wallet_id UUID;
  recipient_wallet_id UUID;
  sender_balance DECIMAL;
  recipient_balance DECIMAL;
  reference_id TEXT;
BEGIN
  -- Generate reference ID for transaction tracking
  reference_id := 'TXN-' || extract(epoch from now())::bigint;
  
  -- Get sender's wallet with row lock
  SELECT id, balance INTO sender_wallet_id, sender_balance
  FROM public.wallets
  WHERE user_id = sender_id AND is_active = true
  FOR UPDATE;
  
  IF sender_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;
  
  -- Get recipient's wallet with row lock
  SELECT id, balance INTO recipient_wallet_id, recipient_balance
  FROM public.wallets
  WHERE user_id = recipient_id AND is_active = true
  FOR UPDATE;
  
  IF recipient_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient wallet not found');
  END IF;
  
  -- Check if sender has sufficient balance
  IF sender_balance < transfer_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Update sender's wallet balance
  UPDATE public.wallets
  SET balance = balance - transfer_amount,
      updated_at = NOW()
  WHERE id = sender_wallet_id;
  
  -- Update recipient's wallet balance
  UPDATE public.wallets
  SET balance = balance + transfer_amount,
      updated_at = NOW()
  WHERE id = recipient_wallet_id;
  
  -- Create transaction records
  INSERT INTO public.transactions (
    wallet_id,
    user_id,
    transaction_type,
    amount,
    description,
    recipient_id,
    reference_id,
    status
  ) VALUES
  (
    sender_wallet_id,
    sender_id,
    'transfer_out',
    transfer_amount,
    transfer_description,
    recipient_id,
    reference_id,
    'completed'
  ),
  (
    recipient_wallet_id,
    recipient_id,
    'transfer_in',
    transfer_amount,
    'Transfer from ' || (SELECT email FROM auth.users WHERE id = sender_id),
    sender_id,
    reference_id,
    'completed'
  );
  
  RETURN json_build_object(
    'success', true,
    'sender_new_balance', sender_balance - transfer_amount,
    'recipient_new_balance', recipient_balance + transfer_amount,
    'reference_id', reference_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
