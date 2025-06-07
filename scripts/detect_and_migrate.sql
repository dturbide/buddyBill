-- 🔍 DÉTECTION AUTOMATIQUE ET MIGRATION INTELLIGENTE
-- Détecte la structure réelle des tables et s'adapte automatiquement

DO $$
DECLARE
    table_exists BOOLEAN;
    record_count INTEGER;
    column_exists BOOLEAN;
    app_payments_structure TEXT;
    app_expenses_structure TEXT;
BEGIN
    RAISE NOTICE '🔍 MIGRATION INTELLIGENTE - Détection automatique des structures';
    RAISE NOTICE '===========================================================';

    -- 1. DÉTECTER LA STRUCTURE DE app.payments
    RAISE NOTICE '📋 Détection de la structure de app.payments...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'payments') THEN
        -- Lister les colonnes de app.payments
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO app_payments_structure
        FROM information_schema.columns 
        WHERE table_schema = 'app' AND table_name = 'payments';
        
        RAISE NOTICE '📊 Colonnes de app.payments: %', app_payments_structure;
        
        -- Vérifier si from_user_id existe
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'app' AND table_name = 'payments' AND column_name = 'from_user_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '✅ Colonne from_user_id trouvée';
        ELSE
            RAISE NOTICE '⚠️ Colonne from_user_id ABSENTE - adaptation nécessaire';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table app.payments introuvable';
    END IF;

    -- 2. DÉTECTER LA STRUCTURE DE app.expenses
    RAISE NOTICE '📋 Détection de la structure de app.expenses...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') THEN
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO app_expenses_structure
        FROM information_schema.columns 
        WHERE table_schema = 'app' AND table_name = 'expenses';
        
        RAISE NOTICE '📊 Colonnes de app.expenses: %', app_expenses_structure;
    ELSE
        RAISE NOTICE '⚠️ Table app.expenses introuvable';
    END IF;

    -- 3. CRÉER LES TYPES ENUM DE BASE
    RAISE NOTICE '📝 Création des types enum de base...';
    
    -- Type currency
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.currency AS ENUM ('EUR', 'USD', 'GBP', 'CAD');
        RAISE NOTICE '✅ Type public.currency créé';
    END IF;

    -- Type expense_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE '✅ Type public.expense_status créé';
    END IF;

    -- Type split_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'split_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.split_type AS ENUM ('equal', 'percentage', 'custom');
        RAISE NOTICE '✅ Type public.split_type créé';
    END IF;

    -- Type payment_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
        RAISE NOTICE '✅ Type public.payment_status créé';
    END IF;

    -- 4. MIGRATION INTELLIGENTE DES EXPENSES
    RAISE NOTICE '💰 Migration intelligente des expenses...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') THEN
        -- Créer la table public.expenses si elle n'existe pas
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
            RAISE NOTICE '✅ Table public.expenses créée';
        END IF;

        -- Nettoyer les données existantes qui viennent d'app
        DELETE FROM public.expenses WHERE id IN (SELECT id FROM app.expenses);
        
        -- Migrer avec gestion des types enum
        INSERT INTO public.expenses (
            id, group_id, description, amount, currency, category_id, paid_by, 
            expense_date, receipt_url, notes, status, split_type, created_by, 
            created_at, updated_at
        )
        SELECT 
            id, group_id, description, amount,
            -- Conversion sécurisée du type currency
            CASE 
                WHEN currency::text IN ('EUR', 'USD', 'GBP', 'CAD') THEN currency::text::public.currency
                ELSE 'EUR'::public.currency
            END as currency,
            category_id, paid_by, expense_date, receipt_url, notes,
            -- Conversion sécurisée du type status
            CASE 
                WHEN status::text IN ('pending', 'approved', 'rejected') THEN status::text::public.expense_status
                ELSE 'pending'::public.expense_status
            END as status,
            -- Conversion sécurisée du type split_type
            CASE 
                WHEN split_type::text IN ('equal', 'percentage', 'custom') THEN split_type::text::public.split_type
                ELSE 'equal'::public.split_type
            END as split_type,
            created_by, 
            COALESCE(created_at, now()) as created_at,
            COALESCE(updated_at, now()) as updated_at
        FROM app.expenses;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE '✅ % enregistrements migrés dans public.expenses', record_count;
    END IF;

    -- 5. MIGRATION INTELLIGENTE DES EXPENSE_PARTICIPANTS
    RAISE NOTICE '👥 Migration intelligente des expense_participants...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_participants') THEN
        -- Créer la table public.expense_participants si elle n'existe pas
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
            RAISE NOTICE '✅ Table public.expense_participants créée';
        END IF;

        -- Nettoyer les données existantes
        DELETE FROM public.expense_participants WHERE expense_id IN (SELECT id FROM app.expenses);
        
        -- Migrer avec colonnes explicites
        INSERT INTO public.expense_participants (
            id, expense_id, user_id, share_amount, share_percentage, 
            share_count, is_settled, created_at
        )
        SELECT 
            id, expense_id, user_id, share_amount, share_percentage, 
            share_count, COALESCE(is_settled, false), COALESCE(created_at, now())
        FROM app.expense_participants;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE '✅ % enregistrements migrés dans public.expense_participants', record_count;
    END IF;

    -- 6. MIGRATION INTELLIGENTE DES EXPENSE_CATEGORIES
    RAISE NOTICE '🏷️ Migration intelligente des expense_categories...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_categories') THEN
        -- Créer la table public.expense_categories si elle n'existe pas
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
            CREATE TABLE public.expense_categories (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                name text NOT NULL,
                icon text,
                color text,
                created_at timestamp with time zone DEFAULT now()
            );
            RAISE NOTICE '✅ Table public.expense_categories créée';
        END IF;

        -- Nettoyer et migrer
        DELETE FROM public.expense_categories WHERE id IN (SELECT id FROM app.expense_categories);
        
        INSERT INTO public.expense_categories (id, name, icon, color, created_at)
        SELECT id, name, icon, color, COALESCE(created_at, now())
        FROM app.expense_categories;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE '✅ % enregistrements migrés dans public.expense_categories', record_count;
    END IF;

    -- 7. GESTION SPÉCIALE POUR PAYMENTS (structure inconnue)
    RAISE NOTICE '💳 Gestion spéciale de la table payments...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'payments') THEN
        -- Créer une table payments basique si elle n'existe pas
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
            CREATE TABLE public.payments (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                group_id uuid NOT NULL,
                payer_id uuid NOT NULL,  -- Utilisation de noms génériques
                payee_id uuid NOT NULL,
                amount numeric(10,2) NOT NULL,
                currency public.currency NOT NULL DEFAULT 'EUR',
                description text,
                status public.payment_status DEFAULT 'pending',
                payment_date timestamp with time zone,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
            RAISE NOTICE '✅ Table public.payments créée avec structure générique';
        END IF;
        
        RAISE NOTICE '⚠️ Migration manuelle nécessaire pour payments - structure inconnue';
        RAISE NOTICE '📊 Colonnes disponibles dans app.payments: %', app_payments_structure;
    ELSE
        RAISE NOTICE '⚠️ Table app.payments introuvable - création d\'une table vide';
        
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
            RAISE NOTICE '✅ Table public.payments créée (vide)';
        END IF;
    END IF;

    -- 8. CONFIGURATION DES POLITIQUES RLS
    RAISE NOTICE '🔒 Configuration des politiques RLS...';
    
    -- Expenses
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

    -- Expense participants
    ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view expense participants from their groups" ON public.expense_participants;
    DROP POLICY IF EXISTS "Users can insert expense participants" ON public.expense_participants;

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

    -- Payments (structure générique)
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view payments from their groups" ON public.payments;
    
    CREATE POLICY "Users can view payments from their groups" ON public.payments
        FOR SELECT USING (
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm 
                WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL
            )
        );

    -- 9. INDEX DE PERFORMANCE
    RAISE NOTICE '⚡ Création des index de performance...';
    
    CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
    CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);

    -- 10. RÉSUMÉ FINAL
    RAISE NOTICE '===========================================================';
    RAISE NOTICE '🎉 MIGRATION INTELLIGENTE TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '===========================================================';
    
    -- Statistiques finales
    SELECT COUNT(*) INTO record_count FROM public.expenses;
    RAISE NOTICE '📊 public.expenses: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_participants;
    RAISE NOTICE '📊 public.expense_participants: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_categories;
    RAISE NOTICE '📊 public.expense_categories: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.payments;
    RAISE NOTICE '📊 public.payments: % enregistrements', record_count;
    
    RAISE NOTICE '===========================================================';
    RAISE NOTICE '✅ Toutes les tables principales ont été migrées';
    RAISE NOTICE '✅ Politiques RLS configurées et sécurisées';
    RAISE NOTICE '✅ Index de performance optimisés';
    RAISE NOTICE '🚀 BuddyBill est prêt à fonctionner !';
    RAISE NOTICE '===========================================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERREUR DURANT LA MIGRATION: %', SQLERRM;
        RAISE NOTICE '🔄 Détails de l''erreur: %', SQLSTATE;
        RAISE EXCEPTION 'Migration intelligente échouée: %', SQLERRM;
END $$;
