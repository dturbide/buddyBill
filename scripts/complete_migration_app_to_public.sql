-- =====================================================
-- MIGRATION COMPLÈTE DU SCHÉMA APP VERS PUBLIC
-- =====================================================
-- Ce script migre toutes les tables du schéma 'app' vers 'public'
-- et met à jour toutes les politiques RLS nécessaires

-- 1. CRÉER LES TYPES ENUM DANS PUBLIC S'ILS N'EXISTENT PAS
DO $$
BEGIN
    -- Currency type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.currency_type AS ENUM ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN', 'BRL');
    END IF;
    
    -- Group member role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.group_member_role AS ENUM ('admin', 'member');
    END IF;
    
    -- Expense status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected', 'settled');
    END IF;
    
    -- Expense split type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_split_type' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.expense_split_type AS ENUM ('equal', 'percentage', 'shares', 'custom');
    END IF;
    
    -- Payment status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'cancelled');
    END IF;

    -- Activity type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.activity_type AS ENUM (
            'expense_created', 'expense_updated', 'expense_deleted',
            'payment_created', 'payment_updated', 'payment_deleted',
            'member_added', 'member_left', 'group_updated'
        );
    END IF;
END $$;

-- 2. SUPPRIMER LES POLITIQUES RLS EXISTANTES SUR LES TABLES APP (pour éviter les conflits)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'app'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 3. MIGRER LES TABLES DE APP VERS PUBLIC
-- Note: L'ordre est important à cause des dépendances de clés étrangères

-- Déplacer les tables de catégories d'abord (pas de dépendances)
ALTER TABLE IF EXISTS app.expense_categories SET SCHEMA public;

-- Ensuite les tables de groupes (déjà dans public, mais au cas où)
-- Les tables groups et group_members sont déjà dans public normalement

-- Migrer les tables dépendantes
ALTER TABLE IF EXISTS app.expenses SET SCHEMA public;
ALTER TABLE IF EXISTS app.expense_participants SET SCHEMA public;
ALTER TABLE IF EXISTS app.payments SET SCHEMA public;

-- Migrer les autres tables si elles existent
ALTER TABLE IF EXISTS app.activity_log SET SCHEMA public;
ALTER TABLE IF EXISTS app.group_invitations SET SCHEMA public;

-- 4. DÉPLACER LES FONCTIONS SI ELLES EXISTENT
DO $$
BEGIN
    -- Fonction de calcul des balances
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app' 
        AND p.proname = 'get_user_balance_in_group'
    ) THEN
        ALTER FUNCTION app.get_user_balance_in_group(uuid, uuid) SET SCHEMA public;
    END IF;

    -- Fonction de mise à jour des timestamps
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app' 
        AND p.proname = 'update_updated_at_column'
    ) THEN
        ALTER FUNCTION app.update_updated_at_column() SET SCHEMA public;
    END IF;

    -- Fonctions de storage
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app' 
        AND p.proname = 'get_user_avatar_url'
    ) THEN
        ALTER FUNCTION app.get_user_avatar_url(uuid) SET SCHEMA public;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app' 
        AND p.proname = 'get_group_image_url'
    ) THEN
        ALTER FUNCTION app.get_group_image_url(uuid) SET SCHEMA public;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app' 
        AND p.proname = 'get_receipt_url'
    ) THEN
        ALTER FUNCTION app.get_receipt_url(uuid) SET SCHEMA public;
    END IF;
END $$;

-- 5. RECRÉER LES POLITIQUES RLS DANS PUBLIC

-- Politiques pour expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view expense categories" ON public.expense_categories
    FOR SELECT USING (true);

-- Politiques pour expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses from their groups" ON public.expenses
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Users can insert expenses in their groups" ON public.expenses
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (created_by = auth.uid());

-- Politiques pour expense_participants
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expense participants from their groups" ON public.expense_participants
    FOR SELECT USING (
        expense_id IN (
            SELECT e.id FROM public.expenses e
            JOIN public.group_members gm ON e.group_id = gm.group_id
            WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Users can insert expense participants" ON public.expense_participants
    FOR INSERT WITH CHECK (
        expense_id IN (
            SELECT e.id FROM public.expenses e
            JOIN public.group_members gm ON e.group_id = gm.group_id
            WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Users can update expense participants" ON public.expense_participants
    FOR UPDATE USING (
        expense_id IN (
            SELECT e.id FROM public.expenses e
            WHERE e.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete expense participants" ON public.expense_participants
    FOR DELETE USING (
        expense_id IN (
            SELECT e.id FROM public.expenses e
            WHERE e.created_by = auth.uid()
        )
    );

-- Politiques pour payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments from their groups" ON public.payments
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Users can insert payments in their groups" ON public.payments
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT gm.group_id 
            FROM public.group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Users can update payments they created" ON public.payments
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete payments they created" ON public.payments
    FOR DELETE USING (created_by = auth.uid());

-- Politiques pour activity_log (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_log') THEN
        ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view activity from their groups" ON public.activity_log
            FOR SELECT USING (
                group_id IN (
                    SELECT gm.group_id 
                    FROM public.group_members gm 
                    WHERE gm.user_id = auth.uid() 
                    AND gm.left_at IS NULL
                )
            );
            
        CREATE POLICY "Users can insert activity logs" ON public.activity_log
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Politiques pour group_invitations (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_invitations') THEN
        ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view invitations to their email" ON public.group_invitations
            FOR SELECT USING (
                invited_email = auth.email() OR
                invited_by = auth.uid() OR
                group_id IN (
                    SELECT gm.group_id 
                    FROM public.group_members gm 
                    WHERE gm.user_id = auth.uid() 
                    AND gm.role = 'admin'
                    AND gm.left_at IS NULL
                )
            );
            
        CREATE POLICY "Group admins can create invitations" ON public.group_invitations
            FOR INSERT WITH CHECK (
                group_id IN (
                    SELECT gm.group_id 
                    FROM public.group_members gm 
                    WHERE gm.user_id = auth.uid() 
                    AND gm.role = 'admin'
                    AND gm.left_at IS NULL
                )
            );
    END IF;
END $$;

-- 6. RECRÉER LES INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user_id ON public.payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user_id ON public.payments(to_user_id);

-- 7. MISE À JOUR DES RÉFÉRENCES DE CONTRAINTES DE CLÉS ÉTRANGÈRES
-- (Cela se fait automatiquement lors du changement de schéma)

-- 8. VÉRIFICATION FINALE
SELECT 
    'Tables migrées dans public:' as info,
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('expense_categories', 'expenses', 'expense_participants', 'payments', 'activity_log', 'group_invitations')
ORDER BY tablename;

-- Vérifier qu'il ne reste rien dans app
SELECT 
    'Tables restantes dans app:' as info,
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'app'
ORDER BY tablename;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'MIGRATION TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE 'Toutes les tables ont été migrées de app vers public';
    RAISE NOTICE 'Les politiques RLS ont été recréées';
    RAISE NOTICE 'Les index de performance ont été ajoutés';
    RAISE NOTICE '=====================================================';
END $$;
