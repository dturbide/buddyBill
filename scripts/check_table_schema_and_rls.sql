-- Script pour vérifier le schéma de la table groups et les politiques RLS

-- 1. Vérifier si la table groups existe et dans quel schéma
SELECT 
    n.nspname as schema,
    c.relname as table_name,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
        ELSE c.relkind::text
    END as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
ORDER BY n.nspname;

-- 2. Vérifier la structure de la table groups (colonnes, types, contraintes)
SELECT 
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    CASE 
        WHEN a.attnotnull THEN 'NOT NULL'
        ELSE 'NULL'
    END as nullable,
    (SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid) 
     FROM pg_catalog.pg_attrdef d
     WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef) as default_value
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
    AND n.nspname = 'public'  -- Remplacer par 'app' si nécessaire
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY a.attnum;

-- 3. Vérifier les contraintes (clés primaires, étrangères, etc.)
SELECT 
    conname as constraint_name,
    pg_catalog.pg_get_constraintdef(oid, true) as constraint_definition
FROM pg_catalog.pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_catalog.pg_class
    WHERE relname = 'groups' AND relnamespace = (
        SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = 'public'  -- Remplacer par 'app' si nécessaire
    )
);

-- 4. Vérifier si RLS est activé sur la table groups
SELECT 
    tablename,
    rowsecurity as "RLS activé"
FROM pg_tables
WHERE schemaname = 'public'  -- Remplacer par 'app' si nécessaire
AND tablename = 'groups';

-- 5. Vérifier les politiques RLS sur la table groups
SELECT 
    policyname,
    permissive,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE schemaname = 'public'  -- Remplacer par 'app' si nécessaire
AND tablename = 'groups';

-- 6. Vérifier les déclencheurs (triggers) sur la table groups
SELECT 
    t.tgname as trigger_name,
    pg_catalog.pg_get_triggerdef(t.oid, true) as trigger_definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
    AND n.nspname = 'public'  -- Remplacer par 'app' si nécessaire
    AND NOT t.tgisinternal;

-- 7. Vérifier les index sur la table groups
SELECT 
    i.relname as index_name,
    a.attname as column_name,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_index ix ON ix.indrelid = c.oid
JOIN pg_catalog.pg_class i ON i.oid = ix.indexrelid
JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(ix.indkey)
WHERE c.relname = 'groups'
    AND n.nspname = 'public'  -- Remplacer par 'app' si nécessaire
ORDER BY i.relname, a.attnum;

-- 8. Tester l'insertion d'un groupe en désactivant temporairement RLS
-- ATTENTION: Ceci est pour le débogage uniquement, ne pas laisser en production
BEGIN;

-- Désactiver temporairement RLS pour le test
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- Insérer un groupe de test
INSERT INTO public.groups (
    name,
    description,
    currency,
    created_by
) VALUES (
    'Groupe Test Débogage',
    'Groupe créé pour tester avec RLS désactivé',
    'EUR',
    auth.uid()
)
RETURNING *;

-- Réactiver RLS immédiatement après le test
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Vérifier que le groupe a été inséré
SELECT * FROM public.groups WHERE name = 'Groupe Test Débogage';

ROLLBACK; -- Annuler l'insertion de test

-- 9. Vérifier si la table est dans le schéma app au lieu de public
SELECT 
    n.nspname as schema,
    c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
AND n.nspname = 'app';

-- 10. Si la table est dans le schéma app, vérifier sa structure
SELECT 
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
    AND n.nspname = 'app'
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY a.attnum;

-- 11. Vérifier les politiques RLS sur la table groups du schéma app
SELECT 
    policyname,
    permissive,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE schemaname = 'app'
AND tablename = 'groups';
