-- Vérifier si les tables existent dans le schéma app
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'app'
    AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments')
ORDER BY tablename;

-- Vérifier si les tables existent dans le schéma public
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments')
ORDER BY tablename;

-- Si les tables sont dans app et pas dans public, voici comment les migrer :
-- ATTENTION : Ne pas exécuter ces commandes si les tables existent déjà dans public !

/*
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
ALTER TABLE IF EXISTS app.groups SET SCHEMA public;
ALTER TABLE IF EXISTS app.group_members SET SCHEMA public;
ALTER TABLE IF EXISTS app.expense_categories SET SCHEMA public;
ALTER TABLE IF EXISTS app.expenses SET SCHEMA public;
ALTER TABLE IF EXISTS app.expense_participants SET SCHEMA public;
ALTER TABLE IF EXISTS app.payments SET SCHEMA public;

-- 3. Déplacer les fonctions
ALTER FUNCTION IF EXISTS app.get_user_balance_in_group(uuid, uuid) SET SCHEMA public;
*/
