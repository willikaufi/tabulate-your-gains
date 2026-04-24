ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_items;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;
ALTER TABLE public.shared_items REPLICA IDENTITY FULL;