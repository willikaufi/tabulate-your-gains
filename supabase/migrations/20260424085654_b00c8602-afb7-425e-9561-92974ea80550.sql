
-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Username format check: 3-30 chars, lowercase letters/numbers/underscore
ALTER TABLE public.profiles
  ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,30}$');

CREATE INDEX idx_profiles_username ON public.profiles (username);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  candidate TEXT;
  suffix INT := 0;
BEGIN
  -- Build base from email local-part, sanitized
  base_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  IF length(base_username) > 24 THEN
    base_username := substr(base_username, 1, 24);
  END IF;

  candidate := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username) VALUES (NEW.id, candidate);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- FRIENDSHIPS
-- =========================================================
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON public.friendships (requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships (addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Only addressee may accept/decline; both may also update (e.g. status)
CREATE POLICY "Addressee can update friendship status"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id);

CREATE POLICY "Either party can delete friendship"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: are two users friends?
CREATE OR REPLACE FUNCTION public.are_friends(_a UUID, _b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND (
        (requester_id = _a AND addressee_id = _b)
        OR (requester_id = _b AND addressee_id = _a)
      )
  );
$$;

-- =========================================================
-- SHARED ITEMS (plans or sessions shared between friends)
-- =========================================================
CREATE TYPE public.shared_item_kind AS ENUM ('plan', 'session');

CREATE TABLE public.shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.shared_item_kind NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_share CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_shared_items_recipient ON public.shared_items (recipient_id, created_at DESC);
CREATE INDEX idx_shared_items_sender ON public.shared_items (sender_id, created_at DESC);

ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender and recipient can view shared items"
  ON public.shared_items FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Friends can share items"
  ON public.shared_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_friends(sender_id, recipient_id)
  );

CREATE POLICY "Sender or recipient can delete shared items"
  ON public.shared_items FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
