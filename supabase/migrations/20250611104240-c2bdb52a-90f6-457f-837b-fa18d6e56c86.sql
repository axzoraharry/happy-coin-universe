
-- Create coin_exchanges table to track conversions
CREATE TABLE public.coin_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL CHECK (coins_spent > 0),
  amount_received DECIMAL(15,2) NOT NULL CHECK (amount_received > 0),
  exchange_rate DECIMAL(10,4) NOT NULL CHECK (exchange_rate > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coin_exchanges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own exchanges" ON public.coin_exchanges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exchanges" ON public.coin_exchanges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle coin exchange
CREATE OR REPLACE FUNCTION exchange_coins_to_balance(
  p_user_id UUID,
  p_coins_to_exchange INTEGER,
  p_exchange_rate DECIMAL DEFAULT 0.01
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_coins INTEGER;
  v_amount_to_add DECIMAL(15,2);
  v_current_balance DECIMAL(15,2);
  v_wallet_id UUID;
  v_exchange_id UUID;
BEGIN
  -- Check if user has enough coins
  SELECT total_coins INTO v_current_coins
  FROM user_coins
  WHERE user_id = p_user_id;
  
  IF v_current_coins IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User coins record not found');
  END IF;
  
  IF v_current_coins < p_coins_to_exchange THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- Calculate amount to add to wallet
  v_amount_to_add := p_coins_to_exchange * p_exchange_rate;
  
  -- Get user's wallet
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM wallets
  WHERE user_id = p_user_id AND is_active = true;
  
  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Create exchange record
  INSERT INTO coin_exchanges (user_id, coins_spent, amount_received, exchange_rate)
  VALUES (p_user_id, p_coins_to_exchange, v_amount_to_add, p_exchange_rate)
  RETURNING id INTO v_exchange_id;
  
  -- Update user coins
  UPDATE user_coins
  SET total_coins = total_coins - p_coins_to_exchange,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update wallet balance
  UPDATE wallets
  SET balance = balance + v_amount_to_add,
      updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Create transaction record
  INSERT INTO transactions (
    wallet_id,
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    status
  ) VALUES (
    v_wallet_id,
    p_user_id,
    'credit',
    v_amount_to_add,
    'Coin exchange: ' || p_coins_to_exchange || ' coins',
    v_exchange_id::text,
    'completed'
  );
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Coins Exchanged',
    'Successfully exchanged ' || p_coins_to_exchange || ' coins for $' || v_amount_to_add,
    'success'
  );
  
  RETURN json_build_object(
    'success', true,
    'coins_exchanged', p_coins_to_exchange,
    'amount_received', v_amount_to_add,
    'new_coin_balance', v_current_coins - p_coins_to_exchange,
    'new_wallet_balance', v_current_balance + v_amount_to_add
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
