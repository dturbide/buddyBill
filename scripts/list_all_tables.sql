-- Script pour lister TOUTES les tables de Supabase avec détails complets

-- 1. Lister toutes les tables par schéma
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pg_catalog.obj_description(c.oid, 'pg_class') as description,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    CASE 
        WHEN n.nspname = 'public' THEN 'Public'
        WHEN n.nspname = 'auth' THEN 'Supabase Auth'
        WHEN n.nspname = 'storage' THEN 'Supabase Storage'
        WHEN n.nspname = 'realtime' THEN 'Supabase Realtime'
        WHEN n.nspname = 'extensions' THEN 'Extensions'
        WHEN n.nspname = 'app' THEN 'Application (Custom)'
        WHEN n.nspname LIKE 'pg_%' THEN 'PostgreSQL System'
        ELSE 'Other'
    END as schema_type
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','p') -- tables et tables partitionnées
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname;

-- 2. Compter les tables par schéma
SELECT 
    n.nspname as schema_name,
    COUNT(*) as table_count
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r','p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
GROUP BY n.nspname
ORDER BY n.nspname;

-- 3. Vérifier spécifiquement les tables de l'application (expense sharing)
SELECT 
    schemaname,
    tablename,
    tableowner,
    CASE 
        WHEN tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments') 
        THEN '✓ Table expense-sharing' 
        ELSE '' 
    END as app_table
FROM pg_tables
WHERE schemaname IN ('public', 'app', 'auth')
    AND tablename NOT LIKE 'pg_%'
ORDER BY schemaname, tablename;

-- 4. Lister tous les schémas disponibles
SELECT 
    nspname as schema_name,
    pg_catalog.obj_description(oid, 'pg_namespace') as description,
    CASE 
        WHEN nspname = 'app' THEN '✓ Schéma app trouvé!'
        ELSE ''
    END as app_schema_check
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND nspname NOT LIKE 'pg_temp_%'
ORDER BY nspname;

-- 5. Vérifier le search_path actuel
SHOW search_path;

-- 6. Lister les types enum créés (pour vérifier si les types de l'app existent)
SELECT 
    n.nspname as schema_name,
    t.typname as type_name,
    CASE 
        WHEN t.typname IN ('currency_type', 'group_member_role', 'expense_status', 'expense_split_type', 'payment_status')
        THEN '✓ Type expense-sharing'
        ELSE ''
    END as app_type
FROM pg_type t
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typtype = 'e' -- enum types
ORDER BY n.nspname, t.typname;
