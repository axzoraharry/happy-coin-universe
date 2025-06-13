
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
