-- Vérifier la structure de la table groups
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'groups' AND table_schema = 'public'
ORDER BY ordinal_position;
