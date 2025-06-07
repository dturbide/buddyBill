-- RESTAURER LA RÉFÉRENCE AUTH.USERS
-- À exécuter après avoir activé l'authentification Supabase
-- ===============================================================

-- 1. Supprimer l'ancienne contrainte de clé primaire
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;

-- 2. Renommer l'ancienne colonne id 
ALTER TABLE public.user_profiles RENAME COLUMN id TO old_id;

-- 3. Ajouter la nouvelle colonne id liée à auth.users
ALTER TABLE public.user_profiles ADD COLUMN id UUID;

-- 4. Mettre à jour la nouvelle colonne id avec auth_user_id si elle existe
UPDATE public.user_profiles 
SET id = auth_user_id 
WHERE auth_user_id IS NOT NULL;

-- 5. Pour les profils sans auth_user_id, garder l'ancien id
UPDATE public.user_profiles 
SET id = old_id 
WHERE id IS NULL;

-- 6. Ajouter la contrainte de clé étrangère vers auth.users
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_auth_fk 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Supprimer les anciennes colonnes
ALTER TABLE public.user_profiles DROP COLUMN old_id;
ALTER TABLE public.user_profiles DROP COLUMN auth_user_id;

-- 8. Créer des utilisateurs de test dans auth.users si nécessaire
-- (À faire manuellement via l'interface Supabase Authentication)

COMMENT ON TABLE public.user_profiles IS 'Table mise à jour pour utiliser auth.users comme clé primaire';
