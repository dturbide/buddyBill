-- 1. Vérifier la structure de user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Voir les profils existants pour comprendre la structure
SELECT * FROM public.user_profiles LIMIT 3;

-- 3. Créer le profil manquant (version simplifiée)
INSERT INTO public.user_profiles (id, full_name)
SELECT 
  'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8',
  'Denis Turbide'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = 'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8'
);

-- 4. Vérifier que le profil a été créé
SELECT * FROM public.user_profiles 
WHERE id = 'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8';
