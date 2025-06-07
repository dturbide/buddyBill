-- Script de diagnostic pour problèmes d'authentification
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table user_profiles existe et sa structure
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'user_profiles';

-- 2. Vérifier les politiques RLS sur user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Vérifier s'il y a des utilisateurs dans auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
LIMIT 5;

-- 4. Vérifier s'il y a des profils utilisateur
SELECT id, full_name, tenant_id, role
FROM user_profiles 
LIMIT 5;

-- 5. Vérifier les politiques RLS générales
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('public', 'app')
AND rowsecurity = true;

-- 6. Vérifier les fonctions d'authentification
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%auth%' OR routine_name LIKE '%user%';
