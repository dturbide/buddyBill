-- ⚡ SCRIPT DE MIGRATION ULTRA-SÉCURISÉ ⚡
-- Gère tous les conflits de types et problèmes possibles

DO $$
DECLARE
    table_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    RAISE NOTICE '🚀 MIGRATION ULTRA-SÉCURISÉE - Schéma APP vers PUBLIC';
    RAISE NOTICE '====================================================';

    -- 1. Vérifier la connexion et les permissions
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user) THEN
        RAISE EXCEPTION 'Erreur de permissions utilisateur';
    END IF;

    -- 2. Créer les types enum dans public s'ils n'existent pas
    RAISE NOTICE '📝 Vérification et création des types enum...';
    
    -- Type currency
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.currency AS ENUM ('EUR', 'USD', 'GBP', 'CAD');
        RAISE NOTICE '✅ Type public.currency créé';
    ELSE
        RAISE NOTICE '⚠️ Type public.currency existe déjà';
    END IF;

    -- Type expense_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE '✅ Type public.expense_status créé';
    ELSE
        RAISE NOTICE '⚠️ Type public.expense_status existe déjà';
    END IF;

    -- Type split_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'split_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.split_type AS ENUM ('equal', 'percentage', 'custom');
        RAISE NOTICE '✅ Type public.split_type créé';
    ELSE
        RAISE NOTICE '⚠️ Type public.split_type existe déjà';
    END IF;

    -- Type payment_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
        RAISE NOTICE '✅ Type public.payment_status créé';
    ELSE
        RAISE NOTICE '⚠️ Type public.payment_status existe déjà';
    END IF;

    -- 3. MIGRATION TABLE EXPENSES
    RAISE NOTICE '💰 Traitement de la table expenses...';
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'expenses'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Créer la table expenses
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
        RAISE NOTICE '✅ Table public.expenses créée';

        -- Migrer les données si la table source existe
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') THEN
            SELECT COUNT(*) INTO record_count FROM app.expenses;
            RAISE NOTICE '📊 Trouvé % enregistrements dans app.expenses', record_count;
            
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
            RAISE NOTICE '✅ % enregistrements migrés dans public.expenses', record_count;
        ELSE
            RAISE NOTICE '⚠️ Pas de table app.expenses à migrer';
        END IF;
    ELSE
        SELECT COUNT(*) INTO record_count FROM public.expenses;
        RAISE NOTICE '⚠️ Table public.expenses existe déjà (% enregistrements)', record_count;
    END IF;

    -- 4. MIGRATION TABLE EXPENSE_PARTICIPANTS
    RAISE NOTICE '👥 Traitement de la table expense_participants...';
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'expense_participants'
    ) INTO table_exists;

    IF NOT table_exists THEN
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
        RAISE NOTICE '✅ Table public.expense_participants créée';

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_participants') THEN
            SELECT COUNT(*) INTO record_count FROM app.expense_participants;
            RAISE NOTICE '📊 Trouvé % enregistrements dans app.expense_participants', record_count;
            
            INSERT INTO public.expense_participants (
                id, expense_id, user_id, share_amount, share_percentage, 
                share_count, is_settled, created_at
            )
            SELECT 
                id, expense_id, user_id, share_amount, share_percentage, 
                share_count, is_settled, created_at
            FROM app.expense_participants;
            
            GET DIAGNOSTICS record_count = ROW_COUNT;
            RAISE NOTICE '✅ % enregistrements migrés dans public.expense_participants', record_count;
        END IF;
    ELSE
        SELECT COUNT(*) INTO record_count FROM public.expense_participants;
        RAISE NOTICE '⚠️ Table public.expense_participants existe déjà (% enregistrements)', record_count;
    END IF;

    -- 5. MIGRATION TABLE EXPENSE_CATEGORIES
    RAISE NOTICE '🏷️ Traitement de la table expense_categories...';
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'expense_categories'
    ) INTO table_exists;

    IF NOT table_exists THEN
        CREATE TABLE public.expense_categories (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            icon text,
            color text,
            created_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE '✅ Table public.expense_categories créée';

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_categories') THEN
            SELECT COUNT(*) INTO record_count FROM app.expense_categories;
            RAISE NOTICE '📊 Trouvé % enregistrements dans app.expense_categories', record_count;
            
            INSERT INTO public.expense_categories (id, name, icon, color, created_at)
            SELECT id, name, icon, color, created_at
            FROM app.expense_categories;
            
            GET DIAGNOSTICS record_count = ROW_COUNT;
            RAISE NOTICE '✅ % enregistrements migrés dans public.expense_categories', record_count;
        ELSE
            RAISE NOTICE '⚠️ Pas de table app.expense_categories à migrer';
        END IF;
    ELSE
        SELECT COUNT(*) INTO record_count FROM public.expense_categories;
        RAISE NOTICE '⚠️ Table public.expense_categories existe déjà (% enregistrements)', record_count;
    END IF;

    -- 6. MIGRATION TABLE PAYMENTS
    RAISE NOTICE '💳 Traitement de la table payments...';
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payments'
    ) INTO table_exists;

    IF NOT table_exists THEN
        CREATE TABLE public.payments (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            group_id uuid NOT NULL,
            from_user_id uuid NOT NULL,
            to_user_id uuid NOT NULL,
            amount numeric(10,2) NOT NULL,
            currency public.currency NOT NULL DEFAULT 'EUR',
            description text,
            status public.payment_status DEFAULT 'pending',
            payment_date timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE '✅ Table public.payments créée';

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'payments') THEN
            SELECT COUNT(*) INTO record_count FROM app.payments;
            RAISE NOTICE '📊 Trouvé % enregistrements dans app.payments', record_count;
            
            INSERT INTO public.payments (
                id, group_id, from_user_id, to_user_id, amount, currency, 
                description, status, payment_date, created_at, updated_at
            )
            SELECT 
                id, group_id, from_user_id, to_user_id, amount, 
                CASE 
                    WHEN currency::text IN ('EUR', 'USD', 'GBP', 'CAD') THEN currency::text::public.currency
                    ELSE 'EUR'::public.currency
                END,
                description, 
                CASE 
                    WHEN status::text IN ('pending', 'completed', 'failed') THEN status::text::public.payment_status
                    ELSE 'pending'::public.payment_status
                END,
                payment_date, created_at, updated_at
            FROM app.payments;
            
            GET DIAGNOSTICS record_count = ROW_COUNT;
            RAISE NOTICE '✅ % enregistrements migrés dans public.payments', record_count;
        END IF;
    ELSE
        SELECT COUNT(*) INTO record_count FROM public.payments;
        RAISE NOTICE '⚠️ Table public.payments existe déjà (% enregistrements) - CONSERVÉE', record_count;
    END IF;

    -- 7. CONFIGURATION DES POLITIQUES RLS
    RAISE NOTICE '🔒 Configuration des politiques de sécurité RLS...';
    
    -- Politiques pour expenses
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses;
    DROP POLICY IF EXISTS "Users can insert expenses in their groups" ON public.expenses;
    DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

    CREATE POLICY "Users can view expenses from their groups" ON public.expenses
        FOR SELECT USING (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    CREATE POLICY "Users can insert expenses in their groups" ON public.expenses
        FOR INSERT WITH CHECK (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    CREATE POLICY "Users can update their own expenses" ON public.expenses
        FOR UPDATE USING (created_by = auth.uid());

    CREATE POLICY "Users can delete their own expenses" ON public.expenses
        FOR DELETE USING (created_by = auth.uid());

    -- Politiques pour expense_participants
    ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view expense participants from their groups" ON public.expense_participants;
    DROP POLICY IF EXISTS "Users can insert expense participants" ON public.expense_participants;
    DROP POLICY IF EXISTS "Users can update expense participants" ON public.expense_participants;
    DROP POLICY IF EXISTS "Users can delete expense participants" ON public.expense_participants;

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
            expense_id IN (SELECT e.id FROM public.expenses e WHERE e.created_by = auth.uid())
        );

    CREATE POLICY "Users can delete expense participants" ON public.expense_participants
        FOR DELETE USING (
            expense_id IN (SELECT e.id FROM public.expenses e WHERE e.created_by = auth.uid())
        );

    -- Politiques pour payments
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view payments from their groups" ON public.payments;
    DROP POLICY IF EXISTS "Users can insert payments in their groups" ON public.payments;
    DROP POLICY IF EXISTS "Users can update payments they created" ON public.payments;
    DROP POLICY IF EXISTS "Users can delete payments they created" ON public.payments;

    CREATE POLICY "Users can view payments from their groups" ON public.payments
        FOR SELECT USING (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    CREATE POLICY "Users can insert payments in their groups" ON public.payments
        FOR INSERT WITH CHECK (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    CREATE POLICY "Users can update payments they created" ON public.payments
        FOR UPDATE USING (from_user_id = auth.uid());

    CREATE POLICY "Users can delete payments they created" ON public.payments
        FOR DELETE USING (from_user_id = auth.uid());

    RAISE NOTICE '✅ Politiques RLS configurées avec succès';

    -- 8. CRÉATION DES INDEX DE PERFORMANCE
    RAISE NOTICE '⚡ Création des index de performance...';
    
    CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
    CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
    
    CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_settled ON public.expense_participants(is_settled);
    
    CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);
    CREATE INDEX IF NOT EXISTS idx_payments_from_user ON public.payments(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_to_user ON public.payments(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

    RAISE NOTICE '✅ Index de performance créés';

    -- 9. RÉSUMÉ FINAL
    RAISE NOTICE '====================================================';
    RAISE NOTICE '🎉 MIGRATION ULTRA-SÉCURISÉE TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '====================================================';
    
    -- Compter les enregistrements dans chaque table
    SELECT COUNT(*) INTO record_count FROM public.expenses;
    RAISE NOTICE '📊 public.expenses: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_participants;
    RAISE NOTICE '📊 public.expense_participants: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_categories;
    RAISE NOTICE '📊 public.expense_categories: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.payments;
    RAISE NOTICE '📊 public.payments: % enregistrements', record_count;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ Toutes les données sont sécurisées dans le schéma public';
    RAISE NOTICE '✅ Politiques RLS activées et configurées';
    RAISE NOTICE '✅ Index de performance optimisés';
    RAISE NOTICE '🚀 Votre application BuddyBill est prête !';
    RAISE NOTICE '====================================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERREUR DURANT LA MIGRATION: %', SQLERRM;
        RAISE NOTICE '🔄 Vous pouvez relancer ce script en toute sécurité';
        RAISE EXCEPTION 'Migration interrompue: %', SQLERRM;
END $$;
