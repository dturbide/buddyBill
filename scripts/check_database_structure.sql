-- Vérifier la structure des tables principales

-- 1. Vérifier les colonnes de la table groups
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'groups' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier si la table expenses existe et ses colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les schémas disponibles
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'app', 'auth');

-- 4. Vérifier toutes les tables dans le schéma public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. Vérifier s'il y a des tables dans un schéma app
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app'
ORDER BY table_name;
