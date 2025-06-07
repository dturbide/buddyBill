-- Vérifier la structure de la base pour les utilisateurs
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'group_members')
ORDER BY table_name, ordinal_position;

-- Vérifier les données dans group_members
SELECT user_id, group_id, created_at 
FROM public.group_members 
LIMIT 5;

-- Vérifier si auth.users est accessible
SELECT id, email, created_at 
FROM auth.users 
LIMIT 3;
