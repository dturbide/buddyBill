-- Table pour les profils utilisateurs, liée à auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  default_currency TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- RLS pour la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Table pour les groupes
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  image_url TEXT,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  is_invite_only BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false, -- Pour l'approbation des dépenses par un admin
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Qui a créé le groupe
);

-- RLS pour la table groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of." -- (Nécessitera une table group_members)
  ON groups FOR SELECT
  USING ( EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid()) ); -- Placeholder, nécessite la table group_members

CREATE POLICY "Authenticated users can insert new groups."
  ON groups FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' AND auth.uid() = created_by );

CREATE POLICY "Group creators can update their own groups."
  ON groups FOR UPDATE
  USING ( auth.uid() = created_by );

CREATE POLICY "Group creators can delete their own groups."
  ON groups FOR DELETE
  USING ( auth.uid() = created_by );


-- Table de jonction pour les membres des groupes (many-to-many)
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  PRIMARY KEY (group_id, user_id)
);

-- RLS pour group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own group memberships."
  ON group_members FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Group creators (admins) can add members."
  ON group_members FOR INSERT
  WITH CHECK ( EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()) ); -- Simplifié, idéalement vérifier le rôle admin

CREATE POLICY "Group creators (admins) can remove members."
  ON group_members FOR DELETE
  USING ( EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()) ); -- Simplifié

-- (Ajoutez d'autres tables comme expenses, comments, payments, balances plus tard)

-- Fonction pour gérer la création automatique de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction après la création d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed an initial group creator if needed for testing RLS (replace with an actual user ID from your Supabase auth)
-- INSERT INTO auth.users (id, email, encrypted_password) VALUES ('your-test-user-uuid', 'test@example.com', 'hashed_password');
-- INSERT INTO profiles (id, username) VALUES ('your-test-user-uuid', 'testuser');
