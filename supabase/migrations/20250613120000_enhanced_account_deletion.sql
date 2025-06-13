
-- Enhanced account deletion with proper auth user cleanup
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_auth_result RECORD;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO v_auth_result FROM auth.users WHERE id = p_user_id;
  
  IF v_auth_result.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in authentication system'
    );
  END IF;

  -- Delete all user data in correct order (respecting foreign keys)
  DELETE FROM public.user_offers WHERE user_id = p_user_id;
  DELETE FROM public.coin_exchanges WHERE user_id = p_user_id;
  DELETE FROM public.referrals WHERE referrer_id = p_user_id OR referred_id = p_user_id;
  DELETE FROM public.transactions WHERE user_id = p_user_id OR recipient_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.user_coins WHERE user_id = p_user_id;
  DELETE FROM public.wallets WHERE user_id = p_user_id;
  DELETE FROM public.transaction_pins WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Delete from auth.users (this will cascade to other auth tables)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- Return success response
  v_result := json_build_object(
    'success', true,
    'message', 'User account and all associated data have been permanently deleted',
    'deleted_at', now()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to delete account: ' || SQLERRM
    );
END;
$$;

-- Function to reactivate a deactivated account
CREATE OR REPLACE FUNCTION public.reactivate_user_account(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists and is deactivated
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_active = false
  ) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Account not found or already active'
    );
  END IF;
  
  -- Reactivate the account
  UPDATE public.profiles
  SET is_active = true, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Create welcome back notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Welcome Back!',
    'Your account has been reactivated. You can now access all features again.',
    'success'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Account successfully reactivated'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to reactivate account: ' || SQLERRM
    );
END;
$$;
