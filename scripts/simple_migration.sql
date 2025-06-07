-- SCRIPT DE MIGRATION SIMPLE ET FONCTIONNEL
-- Corrige les erreurs de syntaxe et migre les donnees

DO $$
DECLARE
    table_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    RAISE NOTICE 'DEBUT DE LA MIGRATION SIMPLE';
    RAISE NOTICE '==============================';

    -- 1. CREER LES TYPES ENUM
    RAISE NOTICE 'Creation des types enum...';
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.currency AS ENUM ('EUR', 'USD', 'GBP', 'CAD');
        RAISE NOTICE 'Type public.currency cree';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE 'Type public.expense_status cree';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'split_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.split_type AS ENUM ('equal', 'percentage', 'custom');
        RAISE NOTICE 'Type public.split_type cree';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
        RAISE NOTICE 'Type public.payment_status cree';
    END IF;

    -- 2. MIGRATION TABLE EXPENSES
    RAISE NOTICE 'Migration de la table expenses...';
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        CREATE TABLE public.expenses (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            group_id uuid NOT NULL,
            description text NOT NULL,
            amount numeric(10,2) NOT NULL,
            currency public.currency NOT NULL DEFAULT 'EUR',
            category_id uuid,
            paid_by uuid NOT NULL,
            expense_date date DEFAULT CURRENT_DATE,
            receipt_url text,
            notes text,
            status public.expense_status DEFAULT 'pending',
            split_type public.split_type DEFAULT 'equal',
            created_by uuid NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE 'Table public.expenses creee';
    END IF;

    -- Migrer les donnees depuis app.expenses si elle existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') THEN
        -- Nettoyer les doublons potentiels
        DELETE FROM public.expenses WHERE id IN (SELECT id FROM app.expenses);
        
        -- Migrer avec conversions de types
        INSERT INTO public.expenses (
            id, group_id, description, amount, currency, category_id, paid_by, 
            expense_date, receipt_url, notes, status, split_type, created_by, 
            created_at, updated_at
        )
        SELECT 
            id, group_id, description, amount,
            CASE 
                WHEN currency::text IN ('EUR', 'USD', 'GBP', 'CAD') THEN currency::text::public.currency
                ELSE 'EUR'::public.currency
            END,
            category_id, paid_by, expense_date, receipt_url, notes,
            CASE 
                WHEN status::text IN ('pending', 'approved', 'rejected') THEN status::text::public.expense_status
                ELSE 'pending'::public.expense_status
            END,
            CASE 
                WHEN split_type::text IN ('equal', 'percentage', 'custom') THEN split_type::text::public.split_type
                ELSE 'equal'::public.split_type
            END,
            created_by, created_at, updated_at
        FROM app.expenses;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE 'Migre % enregistrements dans public.expenses', record_count;
    END IF;

    -- 3. MIGRATION TABLE EXPENSE_PARTICIPANTS
    RAISE NOTICE 'Migration de la table expense_participants...';
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_participants') THEN
        CREATE TABLE public.expense_participants (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            expense_id uuid NOT NULL,
            user_id uuid NOT NULL,
            share_amount numeric(10,2),
            share_percentage numeric(5,2),
            share_count integer,
            is_settled boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE 'Table public.expense_participants creee';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_participants') THEN
        DELETE FROM public.expense_participants WHERE expense_id IN (SELECT id FROM app.expenses);
        
        INSERT INTO public.expense_participants (
            id, expense_id, user_id, share_amount, share_percentage, 
            share_count, is_settled, created_at
        )
        SELECT 
            id, expense_id, user_id, share_amount, share_percentage, 
            share_count, is_settled, created_at
        FROM app.expense_participants;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE 'Migre % enregistrements dans public.expense_participants', record_count;
    END IF;

    -- 4. MIGRATION TABLE EXPENSE_CATEGORIES
    RAISE NOTICE 'Migration de la table expense_categories...';
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
        CREATE TABLE public.expense_categories (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            icon text,
            color text,
            created_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE 'Table public.expense_categories creee';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_categories') THEN
        DELETE FROM public.expense_categories WHERE id IN (SELECT id FROM app.expense_categories);
        
        INSERT INTO public.expense_categories (id, name, icon, color, created_at)
        SELECT id, name, icon, color, created_at
        FROM app.expense_categories;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE 'Migre % enregistrements dans public.expense_categories', record_count;
    END IF;

    -- 5. CREER TABLE PAYMENTS SIMPLE (sans migrer depuis app)
    RAISE NOTICE 'Creation de la table payments...';
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        CREATE TABLE public.payments (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            group_id uuid NOT NULL,
            payer_id uuid NOT NULL,
            payee_id uuid NOT NULL,
            amount numeric(10,2) NOT NULL,
            currency public.currency NOT NULL DEFAULT 'EUR',
            description text,
            status public.payment_status DEFAULT 'pending',
            payment_date timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE 'Table public.payments creee (vide)';
    END IF;

    -- 6. CONFIGURATION RLS BASIQUE
    RAISE NOTICE 'Configuration des politiques RLS...';
    
    -- Expenses
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses;
    CREATE POLICY "Users can view expenses from their groups" ON public.expenses
        FOR SELECT USING (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    DROP POLICY IF EXISTS "Users can insert expenses in their groups" ON public.expenses;
    CREATE POLICY "Users can insert expenses in their groups" ON public.expenses
        FOR INSERT WITH CHECK (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
    CREATE POLICY "Users can update their own expenses" ON public.expenses
        FOR UPDATE USING (created_by = auth.uid());

    DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
    CREATE POLICY "Users can delete their own expenses" ON public.expenses
        FOR DELETE USING (created_by = auth.uid());

    -- Expense participants
    ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view expense participants from their groups" ON public.expense_participants;
    CREATE POLICY "Users can view expense participants from their groups" ON public.expense_participants
        FOR SELECT USING (
            expense_id IN (
                SELECT e.id FROM public.expenses e
                JOIN public.group_members gm ON e.group_id = gm.group_id
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    DROP POLICY IF EXISTS "Users can insert expense participants" ON public.expense_participants;
    CREATE POLICY "Users can insert expense participants" ON public.expense_participants
        FOR INSERT WITH CHECK (
            expense_id IN (
                SELECT e.id FROM public.expenses e
                JOIN public.group_members gm ON e.group_id = gm.group_id
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    -- Payments
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view payments from their groups" ON public.payments;
    CREATE POLICY "Users can view payments from their groups" ON public.payments
        FOR SELECT USING (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    -- 7. INDEX DE PERFORMANCE
    RAISE NOTICE 'Creation des index...';
    
    CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);

    -- 8. RESUME FINAL
    RAISE NOTICE '==============================';
    RAISE NOTICE 'MIGRATION SIMPLE TERMINEE !';
    RAISE NOTICE '==============================';
    
    SELECT COUNT(*) INTO record_count FROM public.expenses;
    RAISE NOTICE 'public.expenses: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_participants;
    RAISE NOTICE 'public.expense_participants: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_categories;
    RAISE NOTICE 'public.expense_categories: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.payments;
    RAISE NOTICE 'public.payments: % enregistrements', record_count;
    
    RAISE NOTICE '==============================';
    RAISE NOTICE 'BuddyBill est pret !';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERREUR: %', SQLERRM;
        RAISE EXCEPTION 'Migration echouee: %', SQLERRM;
END $$;
