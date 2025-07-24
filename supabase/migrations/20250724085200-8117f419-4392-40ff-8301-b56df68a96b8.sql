-- Enable real-time for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Enable real-time for transactions table  
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Enable real-time for virtual_card_transactions table
ALTER TABLE public.virtual_card_transactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_card_transactions;