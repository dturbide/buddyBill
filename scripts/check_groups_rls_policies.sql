-- Vérifier les politiques RLS sur la table groups
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'groups'
ORDER BY cmd, policyname;

-- Vérifier la structure de la table groups
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'groups'
ORDER BY ordinal_position;

-- Vérifier les politiques sur group_members
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'group_members'
ORDER BY cmd, policyname;

-- Tester une requête simple pour voir ce qui se passe
SELECT id, name, created_by 
FROM public.groups 
LIMIT 5;

-- Voir si on peut détecter l'utilisateur actuel
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;
