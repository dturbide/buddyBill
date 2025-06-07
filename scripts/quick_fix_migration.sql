-- 🔧 CORRECTION RAPIDE - Migration Ultra-Sécurisée
-- Corrige l'erreur "INSERT has more expressions than target columns"

DO $$
DECLARE
    table_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    RAISE NOTICE '🔧 CORRECTION RAPIDE - Migration avec colonnes explicites';
    RAISE NOTICE '================================================';

    -- 1. Vérifier et créer les types enum s'ils n'existent pas
    RAISE NOTICE '📝 Vérification des types enum...';
    
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

    -- 2. MIGRATION EXPENSES avec colonnes explicites
    RAISE NOTICE '💰 Migration des expenses avec colonnes explicites...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') THEN
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
            -- Créer la table si elle n'existe pas
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

        -- Vider la table de destination si elle contient déjà des données de test
        DELETE FROM public.expenses WHERE id IN (SELECT id FROM app.expenses);
        
        -- Migrer avec colonnes explicites et conversions de types
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
        RAISE NOTICE '⚠️ Table app.expenses introuvable';
    END IF;

    -- 3. MIGRATION EXPENSE_PARTICIPANTS avec colonnes explicites
    RAISE NOTICE '👥 Migration des expense_participants avec colonnes explicites...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_participants') THEN
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

        -- Vider et migrer avec colonnes explicites
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
        RAISE NOTICE '✅ % enregistrements migrés dans public.expense_participants', record_count;
    ELSE
        RAISE NOTICE '⚠️ Table app.expense_participants introuvable';
    END IF;

    -- 4. MIGRATION EXPENSE_CATEGORIES avec colonnes explicites
    RAISE NOTICE '🏷️ Migration des expense_categories avec colonnes explicites...';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_categories') THEN
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

        -- Vider et migrer avec colonnes explicites
        DELETE FROM public.expense_categories WHERE id IN (SELECT id FROM app.expense_categories);
        
        INSERT INTO public.expense_categories (id, name, icon, color, created_at)
        SELECT id, name, icon, color, created_at
        FROM app.expense_categories;
        
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RAISE NOTICE '✅ % enregistrements migrés dans public.expense_categories', record_count;
    ELSE
        RAISE NOTICE '⚠️ Table app.expense_categories introuvable';
    END IF;

    -- 5. CONFIGURATION DES POLITIQUES RLS
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

    -- 6. INDEX DE PERFORMANCE
    RAISE NOTICE '⚡ Création des index...';
    
    CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE '🎉 CORRECTION TERMINÉE AVEC SUCCÈS !';
    
    -- Statistiques finales
    SELECT COUNT(*) INTO record_count FROM public.expenses;
    RAISE NOTICE '📊 public.expenses: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_participants;
    RAISE NOTICE '📊 public.expense_participants: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM public.expense_categories;
    RAISE NOTICE '📊 public.expense_categories: % enregistrements', record_count;
    
    RAISE NOTICE '====================================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERREUR: %', SQLERRM;
        RAISE EXCEPTION 'Migration échouée: %', SQLERRM;
END $$;
