-- Vérifier si la table tenants existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'tenants' 
AND table_schema = 'public';

-- Si elle existe, vérifier sa structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;
