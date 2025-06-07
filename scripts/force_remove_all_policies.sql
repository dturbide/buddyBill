-- =====================================================
-- SUPPRESSION FORCÉE DE TOUTES LES POLITIQUES RLS
-- Solution radicale pour éliminer la récursion infinie
-- =====================================================

-- 1. Désactiver RLS temporairement sur toutes les tables
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques existantes
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    -- Supprimer toutes les politiques sur public.groups
    FOR pol_record IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'groups'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.groups';
    END LOOP;
    
    -- Supprimer toutes les politiques sur public.group_members
    FOR pol_record IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'group_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.group_members';
    END LOOP;
    
    -- Supprimer toutes les politiques sur public.user_profiles
    FOR pol_record IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.user_profiles';
    END LOOP;
END $$;

-- 3. Réactiver RLS avec des politiques très simples
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Créer des politiques ultra-simples (sans récursion)

-- Politiques pour user_profiles
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Politiques pour groups  
CREATE POLICY "groups_select" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups_insert" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update" ON public.groups FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Politiques pour group_members (très simples)
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_update" ON public.group_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'TOUTES les politiques RLS ont été supprimées et recréées!';
    RAISE NOTICE 'Politiques ultra-simples appliquées - plus de récursion possible.';
    RAISE NOTICE 'Testez maintenant la création de groupe.';
END $$;
