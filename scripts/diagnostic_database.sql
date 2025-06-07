-- =====================================================
-- DIAGNOSTIC DE LA BASE DE DONNÉES BUDDYBALL
-- Pour identifier les problèmes actuels
-- =====================================================

-- 1. Vérifier l'existence des tables
SELECT 'Tables publiques:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('groups', 'group_members', 'user_profiles');

SELECT 'Tables app:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'app' AND tablename IN ('expenses', 'expense_categories', 'payments');

-- 2. Vérifier la structure de la table groups
SELECT 'Structure de public.groups:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'groups'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table group_members
SELECT 'Structure de public.group_members:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'group_members'
ORDER BY ordinal_position;

-- 4. Vérifier les politiques RLS
SELECT 'Politiques RLS sur groups:' as info;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'groups';

SELECT 'Politiques RLS sur group_members:' as info;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'group_members';

-- 5. Compter les données existantes
SELECT 'Données existantes:' as info;
SELECT 'groups' as table_name, COUNT(*) as count FROM public.groups
UNION ALL
SELECT 'group_members' as table_name, COUNT(*) as count FROM public.group_members
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM public.user_profiles;

-- 6. Vérifier les fonctions
SELECT 'Fonctions disponibles:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('generate_invite_code', 'join_group_by_code');

-- Message final
SELECT 'Diagnostic terminé - vérifiez les résultats ci-dessus' as status;
