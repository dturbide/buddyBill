-- =====================================================
-- SCRIPT DE NETTOYAGE ET REDÉPLOIEMENT COMPLET
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- 1. Supprimer toutes les politiques RLS existantes pour les groupes
DROP POLICY IF EXISTS "Users can view groups they are members of" ON app.groups;
DROP POLICY IF EXISTS "Users can create groups" ON app.groups;
DROP POLICY IF EXISTS "Group admins can update group details" ON app.groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON app.groups;

-- 2. Supprimer toutes les politiques RLS existantes pour les membres de groupe
DROP POLICY IF EXISTS "Users can view group memberships for their groups" ON app.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON app.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON app.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON app.group_members;

-- 3. Supprimer toutes les politiques RLS existantes pour les dépenses
DROP POLICY IF EXISTS "Users can view expenses from their groups" ON app.expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON app.expenses;
DROP POLICY IF EXISTS "Expense creators and group admins can update expenses" ON app.expenses;
DROP POLICY IF EXISTS "Group admins can delete expenses" ON app.expenses;

-- 4. Supprimer toutes les politiques RLS existantes pour les participants aux dépenses
DROP POLICY IF EXISTS "Users can view expense participants for their groups" ON app.expense_participants;
DROP POLICY IF EXISTS "Group members can manage expense participants" ON app.expense_participants;

-- 5. Supprimer toutes les politiques RLS existantes pour les paiements
DROP POLICY IF EXISTS "Users can view payments for their groups" ON app.payments;
DROP POLICY IF EXISTS "Group members can create payments" ON app.payments;
DROP POLICY IF EXISTS "Payment creators can update their payments" ON app.payments;

-- 6. Créer le schéma app s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS app;

-- 7. Créer les types enum nécessaires
DO $$ 
BEGIN
    -- Type pour les devises
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
        CREATE TYPE app.currency_type AS ENUM ('USD', 'EUR', 'CAD', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL');
    END IF;

    -- Type pour les rôles dans un groupe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role') THEN
        CREATE TYPE app.group_member_role AS ENUM ('admin', 'member');
    END IF;

    -- Type pour le statut des dépenses
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
        CREATE TYPE app.expense_status AS ENUM ('pending', 'approved', 'rejected', 'settled');
    END IF;

    -- Type pour le type de partage
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_split_type') THEN
        CREATE TYPE app.expense_split_type AS ENUM ('equal', 'percentage', 'shares', 'custom');
    END IF;

    -- Type pour le statut des paiements
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE app.payment_status AS ENUM ('pending', 'confirmed', 'rejected');
    END IF;
END $$;

-- 8. Créer la table des groupes
CREATE TABLE IF NOT EXISTS app.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    currency app.currency_type DEFAULT 'USD',
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- 9. Créer la table des membres de groupe
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

-- 10. Activer RLS sur toutes les tables
ALTER TABLE app.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.group_members ENABLE ROW LEVEL SECURITY;

-- 11. Créer les politiques RLS pour les groupes
CREATE POLICY "Users can view groups they are members of"
  ON app.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.group_members gm 
      WHERE gm.group_id = groups.id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

CREATE POLICY "Users can create groups"
  ON app.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update group details"
  ON app.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app.group_members gm 
      WHERE gm.group_id = groups.id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin' 
      AND gm.left_at IS NULL
    )
  );

-- 12. Créer les politiques RLS pour les membres de groupe
CREATE POLICY "Users can view group memberships for their groups"
  ON app.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

CREATE POLICY "Users can join groups"
  ON app.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can manage members"
  ON app.group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app.group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin' 
      AND gm.left_at IS NULL
    )
  );

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Nettoyage et redéploiement terminés avec succès!';
END $$;
