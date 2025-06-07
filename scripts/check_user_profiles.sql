-- Vérifier les utilisateurs existants dans user_profiles
SELECT 
  id,
  full_name,
  email
FROM public.user_profiles;

-- Vérifier si votre user_id existe
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  up.id as profile_id,
  up.full_name,
  up.email as profile_email
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.id = 'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8';

-- Créer un user_profile manquant si nécessaire
INSERT INTO public.user_profiles (id, full_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email
FROM auth.users au
WHERE au.id = 'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);
