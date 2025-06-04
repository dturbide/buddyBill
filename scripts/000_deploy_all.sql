-- =====================================================
-- EXPENSE SHARING APP - SCRIPT DE DÉPLOIEMENT COMPLET
-- Script 000: Exécute tous les scripts dans l'ordre
-- =====================================================

-- IMPORTANT: Ce script doit être exécuté dans Supabase SQL Editor
-- Il déploiera toute la structure de base de données pour l'application

-- 1. Nettoyer les objets existants (optionnel, décommenter si nécessaire)
/*
DROP SCHEMA IF EXISTS app CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_deletion() CASCADE;
*/

-- 2. Créer le schéma et les tables
\i '001_schema_expense_sharing.sql';

-- 3. Créer les fonctions métier
\i '002_functions_expense_sharing.sql';

-- 4. Activer les politiques RLS
\i '003_rls_policies_expense_sharing.sql';

-- 5. Créer les triggers et vues
\i '004_triggers_views_expense_sharing.sql';

-- 6. Configurer l'authentification et les hooks
\i '005_auth_hooks_expense_sharing.sql';

-- 7. Créer les fonctions helpers pour l'API
\i '006_api_helpers_expense_sharing.sql';

-- 8. Configurer le stockage
\i '007_storage_expense_sharing.sql';

-- 9. Vérifications post-déploiement
DO $$
BEGIN
    -- Vérifier que le schéma app existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'app') THEN
        RAISE EXCEPTION 'Schema app not created';
    END IF;
    
    -- Vérifier que les tables principales existent
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'groups') THEN
        RAISE EXCEPTION 'Table app.groups not created';
    END IF;
    
    -- Vérifier que RLS est activé
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'app' 
          AND tablename = 'groups' 
          AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on app.groups';
    END IF;
    
    RAISE NOTICE 'Deployment completed successfully!';
END;
$$;

-- 10. Afficher un résumé
SELECT 
    'Tables créées' as category,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'app'
UNION ALL
SELECT 
    'Fonctions créées',
    COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'app'
UNION ALL
SELECT 
    'Politiques RLS créées',
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'app'
UNION ALL
SELECT 
    'Triggers créés',
    COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'app';

-- Instructions pour le déploiement:
-- 1. Se connecter à Supabase Dashboard
-- 2. Aller dans SQL Editor
-- 3. Copier et exécuter chaque script dans l'ordre (001 à 007)
-- 4. Ou utiliser ce script pour tout déployer d'un coup
-- 5. Vérifier que tout s'est bien passé avec les requêtes de vérification

-- Notes importantes:
-- - Les buckets de stockage doivent être créés manuellement dans Supabase Storage
-- - Les variables d'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être configurées
-- - Pour les emails d'invitation, configurer un service d'email dans Supabase
-- - Tester les politiques RLS avec différents rôles utilisateur
