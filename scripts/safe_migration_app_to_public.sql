-- Script de migration sécurisé : Schema APP vers PUBLIC
-- Ce script vérifie l'existence des tables avant de les créer pour éviter les erreurs

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🚀 Début de la migration sécurisée du schéma app vers public...';

    -- 1. Créer les types enum dans public s'ils n'existent pas
    
    -- Type currency
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.currency AS ENUM ('EUR', 'USD', 'GBP', 'CAD');
        RAISE NOTICE '✅ Type currency créé dans public';
    ELSE
        RAISE NOTICE '⚠️ Type currency existe déjà dans public';
    END IF;

    -- Type expense_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE '✅ Type expense_status créé dans public';
    ELSE
        RAISE NOTICE '⚠️ Type expense_status existe déjà dans public';
    END IF;

    -- Type split_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'split_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.split_type AS ENUM ('equal', 'percentage', 'custom');
        RAISE NOTICE '✅ Type split_type créé dans public';
    ELSE
        RAISE NOTICE '⚠️ Type split_type existe déjà dans public';
    END IF;

    -- Type payment_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
        RAISE NOTICE '✅ Type payment_status créé dans public';
    ELSE
        RAISE NOTICE '⚠️ Type payment_status existe déjà dans public';
    END IF;

    -- 2. Vérifier et migrer la table expenses
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Créer la table expenses dans public
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

        -- Migrer les données si la table app.expenses existe
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') THEN
            INSERT INTO public.expenses (
                id, group_id, description, amount, currency, category_id, paid_by, 
                expense_date, receipt_url, notes, status, split_type, created_by, 
                created_at, updated_at
            )
            SELECT 
                id, group_id, description, amount, 
                currency::text::public.currency, -- Conversion du type currency
                category_id, paid_by, expense_date, receipt_url, notes, 
                status::text::public.expense_status, -- Conversion du type status
                split_type::text::public.split_type, -- Conversion du type split_type
                created_by, created_at, updated_at
            FROM app.expenses;
            RAISE NOTICE '✅ Table expenses migrée avec données depuis app.expenses (avec conversion de types)';
        ELSE
            RAISE NOTICE '✅ Table expenses créée dans public (pas de données app à migrer)';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table expenses existe déjà dans public - migration des données ignorée';
    END IF;

    -- 3. Vérifier et migrer la table expense_participants
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expense_participants'
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

        -- Migrer les données si elles existent
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_participants') THEN
            INSERT INTO public.expense_participants SELECT * FROM app.expense_participants;
            RAISE NOTICE '✅ Table expense_participants migrée avec données';
        ELSE
            RAISE NOTICE '✅ Table expense_participants créée dans public';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table expense_participants existe déjà dans public';
    END IF;

    -- 4. Vérifier et migrer la table expense_categories
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expense_categories'
    ) INTO table_exists;

    IF NOT table_exists THEN
        CREATE TABLE public.expense_categories (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            icon text,
            color text,
            created_at timestamp with time zone DEFAULT now()
        );

        -- Migrer les données si elles existent
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expense_categories') THEN
            INSERT INTO public.expense_categories SELECT * FROM app.expense_categories;
            RAISE NOTICE '✅ Table expense_categories migrée avec données';
        ELSE
            RAISE NOTICE '✅ Table expense_categories créée dans public';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table expense_categories existe déjà dans public';
    END IF;

    -- 5. Vérifier et migrer la table payments
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
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

        -- Migrer les données si elles existent
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'payments') THEN
            INSERT INTO public.payments (
                id, group_id, from_user_id, to_user_id, amount, currency, 
                description, status, payment_date, created_at, updated_at
            )
            SELECT 
                id, group_id, from_user_id, to_user_id, amount, 
                currency::text::public.currency, -- Conversion du type currency
                description, 
                status::text::public.payment_status, -- Conversion du type status
                payment_date, created_at, updated_at
            FROM app.payments;
            RAISE NOTICE '✅ Table payments migrée avec données (avec conversion de types)';
        ELSE
            RAISE NOTICE '✅ Table payments créée dans public';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table payments existe déjà dans public - données conservées';
    END IF;

    -- 6. Créer les politiques RLS pour expenses
    RAISE NOTICE '🔒 Configuration des politiques RLS...';
    
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

    -- Supprimer les politiques existantes si elles existent
    DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses;
    DROP POLICY IF EXISTS "Users can insert expenses in their groups" ON public.expenses;
    DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

    -- Créer les nouvelles politiques
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

    -- 7. Politiques RLS pour expense_participants
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

    -- 8. Politiques RLS pour payments
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view payments from their groups" ON public.payments;
    DROP POLICY IF EXISTS "Users can insert payments in their groups" ON public.payments;
    DROP POLICY IF EXISTS "Users can update payments they created" ON public.payments;
    DROP POLICY IF EXISTS "Users can delete payments they created" ON public.payments;

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
        FOR UPDATE USING (from_user_id = auth.uid());

    CREATE POLICY "Users can delete payments they created" ON public.payments
        FOR DELETE USING (from_user_id = auth.uid());

    -- 9. Créer les index de performance
    CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
    CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
    
    CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
    CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);
    CREATE INDEX IF NOT EXISTS idx_payments_from_user ON public.payments(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_to_user ON public.payments(to_user_id);

    -- 10. Nettoyer les tables app si elles existent et que la migration s'est bien passée
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'expenses') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        
        RAISE NOTICE '🧹 Nettoyage des anciennes tables app...';
        
        -- On peut optionnellement supprimer les tables app ici
        -- DROP TABLE IF EXISTS app.expense_participants CASCADE;
        -- DROP TABLE IF EXISTS app.expenses CASCADE;
        -- DROP TABLE IF EXISTS app.expense_categories CASCADE;
        -- DROP TABLE IF EXISTS app.payments CASCADE;
        
        RAISE NOTICE '⚠️ Tables app conservées pour sécurité - vous pouvez les supprimer manuellement après vérification';
    END IF;

    RAISE NOTICE '=====================================================';
    RAISE NOTICE '🎉 MIGRATION SÉCURISÉE TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE 'Tables migrées de app vers public avec vérifications';
    RAISE NOTICE 'Politiques RLS mises à jour';
    RAISE NOTICE 'Index de performance ajoutés';
    RAISE NOTICE '=====================================================';
END $$;
