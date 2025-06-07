-- Script de migration des tables du schéma app vers public
-- IMPORTANT: Exécuter ce script dans Supabase SQL Editor

-- 1. Créer les types enum dans public s'ils n'existent pas
DO $$ 
BEGIN
    -- Currency type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.currency_type AS ENUM ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY');
    END IF;
    
    -- Group member role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.group_member_role AS ENUM ('admin', 'member');
    END IF;
    
    -- Expense status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.expense_status AS ENUM ('pending', 'settled', 'cancelled');
    END IF;
    
    -- Expense split type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_split_type' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.expense_split_type AS ENUM ('equal', 'percentage', 'amount', 'shares');
    END IF;
    
    -- Payment status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'cancelled');
    END IF;
END $$;

-- 2. Déplacer les tables de app vers public
ALTER TABLE app.groups SET SCHEMA public;
ALTER TABLE app.group_members SET SCHEMA public;
ALTER TABLE app.expense_categories SET SCHEMA public;
ALTER TABLE app.expenses SET SCHEMA public;
ALTER TABLE app.expense_participants SET SCHEMA public;
ALTER TABLE app.payments SET SCHEMA public;

-- 3. Déplacer les fonctions si elles existent
DO $$
BEGIN
    -- Vérifier si la fonction existe avant de la déplacer
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app' 
        AND p.proname = 'get_user_balance_in_group'
    ) THEN
        ALTER FUNCTION app.get_user_balance_in_group(uuid, uuid) SET SCHEMA public;
    END IF;
END $$;

-- 4. Vérifier que tout a bien été migré
SELECT 
    'Tables dans public:' as info,
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments', 'expense_categories')
ORDER BY tablename;

-- 5. Vérifier qu'il ne reste rien dans app
SELECT 
    'Tables restantes dans app:' as info,
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'app'
ORDER BY tablename;
