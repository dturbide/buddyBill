-- =====================================================
-- RESTAURATION DU SCHÉMA PUBLIC POUR BUDDYBALL
-- À exécuter AVANT restore_app_schema.sql
-- =====================================================

-- 1. Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Créer les types enum dans public
DO $$ 
BEGIN
    -- Type pour les rôles dans un groupe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.group_member_role AS ENUM ('admin', 'member');
    END IF;

    -- Type pour le statut d'invitation
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected');
    END IF;
END $$;

-- 3. Créer la table user_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer la table groups si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    invite_code TEXT UNIQUE
);

-- 5. Créer la table group_members si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role public.group_member_role DEFAULT 'member',
    invitation_status public.invitation_status DEFAULT 'accepted',
    invited_by UUID REFERENCES public.user_profiles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 6. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON public.group_members(role);

-- 7. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Activer RLS sur toutes les tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 9. Politiques RLS pour user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 10. Politiques RLS pour groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = groups.id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = groups.id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin' 
      AND gm.left_at IS NULL
    )
  );

-- 11. Politiques RLS pour group_members
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
CREATE POLICY "Users can view group members for their groups"
  ON public.group_members FOR SELECT
  USING (
    -- L'utilisateur peut voir les membres des groupes où il est membre
    user_id = auth.uid() OR
    group_id IN (
      SELECT g.id FROM public.groups g
      WHERE g.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group admins can manage group members" ON public.group_members;
CREATE POLICY "Group admins can manage group members"
  ON public.group_members FOR ALL
  USING (
    -- Seuls les créateurs de groupe ou les admins peuvent gérer
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    ) OR
    (role = 'admin' AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    (
      -- L'utilisateur peut s'ajouter lui-même
      user_id = auth.uid() OR
      -- Ou être ajouté par le créateur du groupe
      EXISTS (
        SELECT 1 FROM public.groups g 
        WHERE g.id = group_id 
        AND g.created_by = auth.uid()
      )
    )
  );

-- 12. Fonction pour gérer l'insertion automatique du profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Schéma public restauré avec succès!';
    RAISE NOTICE 'Tables créées: user_profiles, groups, group_members';
    RAISE NOTICE 'Prêt pour l''exécution de restore_app_schema.sql';
END $$;
