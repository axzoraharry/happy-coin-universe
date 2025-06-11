
-- Create transaction_pins table for PIN functionality
CREATE TABLE public.transaction_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security
ALTER TABLE public.transaction_pins ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction_pins
CREATE POLICY "Users can view their own PIN" 
  ON public.transaction_pins 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PIN" 
  ON public.transaction_pins 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIN" 
  ON public.transaction_pins 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIN" 
  ON public.transaction_pins 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add is_active column to profiles table for account deactivation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create function for GDPR compliant data deletion
CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Delete all user data in correct order (respecting foreign keys)
  DELETE FROM public.user_offers WHERE user_id = p_user_id;
  DELETE FROM public.coin_exchanges WHERE user_id = p_user_id;
  DELETE FROM public.transactions WHERE user_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.user_coins WHERE user_id = p_user_id;
  DELETE FROM public.wallets WHERE user_id = p_user_id;
  DELETE FROM public.transaction_pins WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Return success response
  v_result := json_build_object(
    'success', true,
    'message', 'All user data has been permanently deleted',
    'deleted_at', now()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
