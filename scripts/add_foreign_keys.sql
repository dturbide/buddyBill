-- Script pour ajouter les contraintes de clés étrangères manquantes

DO $$
BEGIN
    -- Ajouter contrainte FK entre expense_participants et expenses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expense_participants_expense_id_fkey'
        AND table_name = 'expense_participants'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expense_participants 
        ADD CONSTRAINT expense_participants_expense_id_fkey 
        FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte FK expense_participants -> expenses ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte FK expense_participants -> expenses existe déjà';
    END IF;

    -- Ajouter contrainte FK entre expense_participants et user_profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expense_participants_user_id_fkey'
        AND table_name = 'expense_participants'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expense_participants 
        ADD CONSTRAINT expense_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte FK expense_participants -> user_profiles ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte FK expense_participants -> user_profiles existe déjà';
    END IF;

    -- Ajouter contrainte FK entre expenses et groups
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenses_group_id_fkey'
        AND table_name = 'expenses'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expenses 
        ADD CONSTRAINT expenses_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte FK expenses -> groups ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte FK expenses -> groups existe déjà';
    END IF;

    -- Ajouter contrainte FK entre expenses et user_profiles (created_by)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenses_created_by_fkey'
        AND table_name = 'expenses'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expenses 
        ADD CONSTRAINT expenses_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte FK expenses -> user_profiles(created_by) ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte FK expenses -> user_profiles(created_by) existe déjà';
    END IF;

    RAISE NOTICE 'Toutes les contraintes de clés étrangères ont été vérifiées/ajoutées';
END $$;
