-- Script pour créer les tables manquantes d'expenses
-- À exécuter dans Supabase SQL Editor

-- Créer la table expenses si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category_id VARCHAR(50),
    paid_by UUID NOT NULL REFERENCES auth.users(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    expense_date TIMESTAMPTZ NOT NULL,
    split_type VARCHAR(20) DEFAULT 'equal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer la table expense_participants si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expense_id, user_id)
);

-- Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);

-- Vérifier que les tables ont été créées
SELECT tablename FROM pg_tables WHERE tablename IN ('expenses', 'expense_participants') AND schemaname = 'public';
