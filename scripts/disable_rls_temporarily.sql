-- Script pour désactiver temporairement RLS et permettre la création de groupes

-- 1. Vérifier toutes les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments', 'expense_categories')
ORDER BY tablename, policyname;

-- 2. Supprimer TOUTES les politiques sur les tables concernées
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Supprimer toutes les politiques des tables expense-sharing
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments', 'expense_categories')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
    END LOOP;
END $$;

-- 3. Désactiver RLS sur toutes les tables
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- 4. Vérifier que RLS est bien désactivé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments', 'expense_categories')
ORDER BY tablename;

-- 5. Message de confirmation
SELECT 'RLS has been disabled on all expense-sharing tables. You can now create groups without restrictions.' as message;

-- NOTE: Pour réactiver RLS avec des politiques correctes, utilisez le script suivant :
/*
-- Script pour réactiver RLS avec des politiques simples et sans récursion

-- 1. Activer RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Créer des politiques très simples pour les utilisateurs authentifiés

-- Politique permissive pour groups (tous les utilisateurs authentifiés peuvent tout faire)
CREATE POLICY "Authenticated users full access" ON public.groups
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique permissive pour group_members
CREATE POLICY "Authenticated users full access" ON public.group_members
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique permissive pour expense_categories (lecture seule)
CREATE POLICY "Authenticated users can read" ON public.expense_categories
    FOR SELECT 
    TO authenticated
    USING (true);

-- Politique permissive pour expenses
CREATE POLICY "Authenticated users full access" ON public.expenses
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique permissive pour expense_participants
CREATE POLICY "Authenticated users full access" ON public.expense_participants
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique permissive pour payments
CREATE POLICY "Authenticated users full access" ON public.payments
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);
*/
