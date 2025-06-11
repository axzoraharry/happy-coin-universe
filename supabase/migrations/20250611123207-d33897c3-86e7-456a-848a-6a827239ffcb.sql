
-- Create referrals table to track referral relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users NOT NULL,
  referred_id UUID REFERENCES auth.users NOT NULL,
  referral_code TEXT NOT NULL,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Add referral_code column to profiles table
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for referrals
CREATE POLICY "Users can view their own referral data" 
  ON public.referrals 
  FOR SELECT 
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referral records" 
  ON public.referrals 
  FOR INSERT 
  WITH CHECK (auth.uid() = referred_id);

-- Update the handle_new_user function to generate referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with generated referral code
  INSERT INTO public.profiles (id, email, full_name, referral_code)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    UPPER(SUBSTRING(NEW.id::text, 1, 8))
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Initialize coins
  INSERT INTO public.user_coins (user_id)
  VALUES (NEW.id);
  
  -- Welcome notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Welcome!', 'Welcome to your digital wallet. Start earning coins and managing your finances!', 'success');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral on signup
CREATE OR REPLACE FUNCTION public.process_referral(p_referred_user_id UUID, p_referral_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_bonus INTEGER := 100; -- Bonus coins for both users
BEGIN
  -- Find the referrer by referral code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = UPPER(p_referral_code)
  AND id != p_referred_user_id; -- Can't refer yourself
  
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
  VALUES (v_referrer_id, p_referred_user_id, UPPER(p_referral_code));
  
  -- Award bonus coins to referrer
  UPDATE public.user_coins
  SET total_coins = total_coins + v_referral_bonus,
      updated_at = NOW()
  WHERE user_id = v_referrer_id;
  
  -- Award bonus coins to referred user
  UPDATE public.user_coins
  SET total_coins = total_coins + v_referral_bonus,
      updated_at = NOW()
  WHERE user_id = p_referred_user_id;
  
  -- Update referral as bonus awarded
  UPDATE public.referrals
  SET bonus_awarded = true
  WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id;
  
  -- Create notifications
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES 
    (v_referrer_id, 'Referral Bonus!', 'You earned ' || v_referral_bonus || ' coins for referring a friend!', 'success'),
    (p_referred_user_id, 'Welcome Bonus!', 'You earned ' || v_referral_bonus || ' coins from your referral!', 'success');
  
  RETURN json_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'bonus_awarded', v_referral_bonus
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'You have already been referred');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
