-- Vérifier l'existence des tables et leurs schémas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('groups', 'group_members', 'expenses', 'payments')
ORDER BY schemaname, tablename;

-- Vérifier les colonnes de la table groups
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'groups'
ORDER BY ordinal_position;

-- Vérifier les types enum
SELECT 
  n.nspname as schema,
  t.typname as type_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname IN ('currency_type', 'group_member_role', 'expense_status', 'expense_split_type', 'payment_status')
ORDER BY t.typname, e.enumsortorder;

-- Vérifier le search_path actuel
SHOW search_path;
