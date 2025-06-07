-- Script simple pour créer les tables manquantes rapidement

-- 1. Créer le type enum currency s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE public.currency AS ENUM ('EUR', 'USD', 'GBP', 'CAD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Créer le type enum payment_status s'il n'existe pas  
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Créer la table payments
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid,
    payer_id uuid NOT NULL,
    payee_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency public.currency NOT NULL DEFAULT 'EUR',
    description text,
    payment_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Créer la table expense_participants s'il n'existe pas
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id uuid NOT NULL,
    user_id uuid NOT NULL,
    share_amount numeric(10,2),
    share_percentage numeric(5,2),
    share_count integer,
    is_settled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Ajouter les contraintes de clés étrangères si elles n'existent pas
DO $$
BEGIN
    -- FK expense_participants -> expenses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expense_participants_expense_id_fkey'
        AND table_name = 'expense_participants'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expense_participants 
        ADD CONSTRAINT expense_participants_expense_id_fkey 
        FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;
    END IF;

    -- FK expense_participants -> user_profiles  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expense_participants_user_id_fkey'
        AND table_name = 'expense_participants'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expense_participants 
        ADD CONSTRAINT expense_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;

    -- FK payments -> user_profiles (payer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_payer_id_fkey'
        AND table_name = 'payments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_payer_id_fkey 
        FOREIGN KEY (payer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;

    -- FK payments -> user_profiles (payee)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_payee_id_fkey'
        AND table_name = 'payments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_payee_id_fkey 
        FOREIGN KEY (payee_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;

    -- FK payments -> groups (optionnel)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payments_group_id_fkey'
        AND table_name = 'payments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments 
        ADD CONSTRAINT payments_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Créer des données de test dans expense_participants basées sur les expenses existantes
INSERT INTO public.expense_participants (expense_id, user_id, share_amount)
SELECT 
    e.id as expense_id,
    e.paid_by as user_id,
    e.amount as share_amount
FROM public.expenses e
WHERE NOT EXISTS (
    SELECT 1 FROM public.expense_participants ep 
    WHERE ep.expense_id = e.id AND ep.user_id = e.paid_by
)
ON CONFLICT DO NOTHING;

-- 7. Pour chaque dépense, ajouter les autres membres du groupe comme participants
INSERT INTO public.expense_participants (expense_id, user_id, share_amount)
SELECT DISTINCT
    e.id as expense_id,
    gm.user_id,
    -(e.amount / (SELECT COUNT(*) FROM public.group_members WHERE group_id = e.group_id AND left_at IS NULL)) as share_amount
FROM public.expenses e
JOIN public.group_members gm ON e.group_id = gm.group_id
WHERE gm.user_id != e.paid_by 
AND gm.left_at IS NULL
AND NOT EXISTS (
    SELECT 1 FROM public.expense_participants ep 
    WHERE ep.expense_id = e.id AND ep.user_id = gm.user_id
)
ON CONFLICT DO NOTHING;

-- Tables et données de test créées avec succès
