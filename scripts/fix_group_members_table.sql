-- =====================================================
-- SCRIPT POUR CORRIGER LA TABLE GROUP_MEMBERS
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- Vérifier si le schéma app existe
CREATE SCHEMA IF NOT EXISTS app;

-- Créer le type enum pour les rôles s'il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role') THEN
        CREATE TYPE app.group_member_role AS ENUM ('admin', 'member');
    END IF;
END $$;

-- Créer ou modifier la table group_members avec les colonnes minimales requises
CREATE TABLE IF NOT EXISTS app.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role app.group_member_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES public.user_profiles(id),
    invitation_status TEXT DEFAULT 'accepted',
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Ajouter invitation_status si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'group_members' 
        AND column_name = 'invitation_status'
    ) THEN
        ALTER TABLE app.group_members ADD COLUMN invitation_status TEXT DEFAULT 'accepted';
    END IF;

    -- Ajouter invited_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'group_members' 
        AND column_name = 'invited_by'
    ) THEN
        ALTER TABLE app.group_members ADD COLUMN invited_by UUID REFERENCES public.user_profiles(id);
    END IF;

    -- Ajouter left_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'group_members' 
        AND column_name = 'left_at'
    ) THEN
        ALTER TABLE app.group_members ADD COLUMN left_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Afficher le schéma actuel de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'app' 
AND table_name = 'group_members'
ORDER BY ordinal_position;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Table group_members mise à jour avec succès!';
END $$;
