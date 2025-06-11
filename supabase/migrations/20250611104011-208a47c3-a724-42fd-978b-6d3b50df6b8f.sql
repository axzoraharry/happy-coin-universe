
-- Create a function to reset daily coins for all users
CREATE OR REPLACE FUNCTION reset_daily_coins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_coins 
  SET earned_today = 0, 
      updated_at = now()
  WHERE earned_today > 0;
  
  -- Log the reset operation
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    uc.user_id,
    'Daily Reset',
    'Your daily coin counter has been reset. Start earning again!',
    'info'
  FROM user_coins uc
  WHERE uc.earned_today > 0;
END;
$$;

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every day at midnight UTC
SELECT cron.schedule(
  'daily-coin-reset',
  '0 0 * * *', -- At 00:00 (midnight) every day
  'SELECT reset_daily_coins();'
);
