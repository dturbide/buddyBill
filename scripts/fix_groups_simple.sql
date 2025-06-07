-- Script simplifié pour corriger les problèmes avec les tables de groupes

-- 1. Vérifier dans quels schémas se trouvent les tables
SELECT 'Vérification des tables groups dans tous les schémas:' as info;
SELECT 
    n.nspname as schema,
    c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
ORDER BY n.nspname;

-- 2. Désactiver temporairement RLS sur les tables de groupes (public et app)
ALTER TABLE IF EXISTS public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.group_members DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporairement désactivé sur les tables groups et group_members' as info;

-- 3. Vérifier si les tables existent dans le schéma public
SELECT 'Tables dans le schéma public:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members');

-- 4. Vérifier si les tables existent dans le schéma app
SELECT 'Tables dans le schéma app:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('groups', 'group_members');

-- 5. Vérifier les utilisateurs disponibles
SELECT 'Utilisateurs disponibles:' as info;
SELECT id, email FROM auth.users LIMIT 10;

-- 6. Vérifier les politiques RLS actuelles
SELECT 'Politiques RLS actuelles:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname IN ('public', 'app')
AND tablename IN ('groups', 'group_members')
ORDER BY schemaname, tablename, policyname;

-- 7. Supprimer les politiques existantes qui pourraient causer des problèmes
DROP POLICY IF EXISTS groups_insert_policy ON public.groups;
DROP POLICY IF EXISTS groups_select_policy ON public.groups;
DROP POLICY IF EXISTS group_members_insert_policy ON public.group_members;
DROP POLICY IF EXISTS group_members_select_policy ON public.group_members;

-- 8. Créer des politiques simples pour les groupes
CREATE POLICY groups_insert_policy ON public.groups
    FOR INSERT TO authenticated
    WITH CHECK (true);  -- Permettre à tous les utilisateurs authentifiés d'insérer

CREATE POLICY groups_select_policy ON public.groups
    FOR SELECT TO authenticated
    USING (true);  -- Permettre à tous les utilisateurs authentifiés de voir tous les groupes

-- 9. Créer des politiques simples pour les membres de groupes
CREATE POLICY group_members_insert_policy ON public.group_members
    FOR INSERT TO authenticated
    WITH CHECK (true);  -- Permettre à tous les utilisateurs authentifiés d'insérer

CREATE POLICY group_members_select_policy ON public.group_members
    FOR SELECT TO authenticated
    USING (true);  -- Permettre à tous les utilisateurs authentifiés de voir tous les membres

-- 10. Réactiver RLS avec les nouvelles politiques simples
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_members ENABLE ROW LEVEL SECURITY;

SELECT 'RLS réactivé avec des politiques simples' as info;

-- 11. Vérifier les politiques RLS après modification
SELECT 'Politiques RLS après modification:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname IN ('public', 'app')
AND tablename IN ('groups', 'group_members')
ORDER BY schemaname, tablename, policyname;
