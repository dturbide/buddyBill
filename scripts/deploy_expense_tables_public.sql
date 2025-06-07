-- Script de déploiement des tables de partage de dépenses dans le schéma PUBLIC
-- Pour l'application BuddyBill

-- Nettoyage des objets existants (optionnel, décommenter si nécessaire)
/*
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.expense_participants CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.expense_split_type CASCADE;
DROP TYPE IF EXISTS public.expense_status CASCADE;
DROP TYPE IF EXISTS public.group_member_role CASCADE;
DROP TYPE IF EXISTS public.currency_type CASCADE;
*/

-- Créer les types enum dans PUBLIC
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

-- Table des groupes
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    currency public.currency_type DEFAULT 'USD',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des membres de groupe
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.group_member_role DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Table des catégories de dépenses
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color
    is_default BOOLEAN DEFAULT FALSE
);

-- Table des dépenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency public.currency_type DEFAULT 'USD',
    expense_date DATE DEFAULT CURRENT_DATE,
    split_type public.expense_split_type DEFAULT 'equal',
    status public.expense_status DEFAULT 'pending',
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des participants aux dépenses
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_owed DECIMAL(10, 2) NOT NULL CHECK (amount_owed >= 0),
    percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
    shares INTEGER CHECK (shares >= 0),
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    UNIQUE(expense_id, user_id)
);

-- Table des paiements/remboursements
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency public.currency_type DEFAULT 'USD',
    status public.payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CHECK (from_user != to_user)
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user ON public.payments(from_user);
CREATE INDEX IF NOT EXISTS idx_payments_to_user ON public.payments(to_user);

-- Fonction pour calculer le solde d'un utilisateur dans un groupe
CREATE OR REPLACE FUNCTION public.get_user_balance_in_group(
    p_user_id UUID,
    p_group_id UUID
) RETURNS TABLE (
    total_paid DECIMAL,
    total_owed DECIMAL,
    net_balance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH paid AS (
        SELECT COALESCE(SUM(amount), 0) as total
        FROM public.expenses
        WHERE paid_by = p_user_id
        AND group_id = p_group_id
        AND status != 'cancelled'
    ),
    owed AS (
        SELECT COALESCE(SUM(ep.amount_owed), 0) as total
        FROM public.expense_participants ep
        JOIN public.expenses e ON ep.expense_id = e.id
        WHERE ep.user_id = p_user_id
        AND e.group_id = p_group_id
        AND e.status != 'cancelled'
        AND NOT ep.is_settled
    ),
    payments_made AS (
        SELECT COALESCE(SUM(amount), 0) as total
        FROM public.payments
        WHERE from_user = p_user_id
        AND group_id = p_group_id
        AND status = 'completed'
    ),
    payments_received AS (
        SELECT COALESCE(SUM(amount), 0) as total
        FROM public.payments
        WHERE to_user = p_user_id
        AND group_id = p_group_id
        AND status = 'completed'
    )
    SELECT 
        paid.total + payments_made.total,
        owed.total,
        (paid.total + payments_received.total) - (owed.total + payments_made.total)
    FROM paid, owed, payments_made, payments_received;
END;
$$ LANGUAGE plpgsql;

-- Activer RLS sur toutes les tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la table groups
CREATE POLICY "Users can view groups they are members of" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
        )
    );

-- Politiques RLS pour la table group_members
CREATE POLICY "Users can view members of their groups" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can manage members" ON public.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

-- Politiques pour expense_categories (publiques en lecture)
CREATE POLICY "Everyone can view expense categories" ON public.expense_categories
    FOR SELECT USING (true);

CREATE POLICY "Only system can manage expense categories" ON public.expense_categories
    FOR ALL USING (false);

-- Politiques pour expenses
CREATE POLICY "Users can view expenses in their groups" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can create expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Expense creator can update their expenses" ON public.expenses
    FOR UPDATE USING (paid_by = auth.uid());

-- Politiques pour expense_participants
CREATE POLICY "Users can view expense participants in their groups" ON public.expense_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON e.group_id = gm.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Expense creator can manage participants" ON public.expense_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.expenses
            WHERE expenses.id = expense_participants.expense_id
            AND expenses.paid_by = auth.uid()
        )
    );

-- Politiques pour payments
CREATE POLICY "Users can view payments in their groups" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = payments.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create payments they make" ON public.payments
    FOR INSERT WITH CHECK (from_user = auth.uid());

CREATE POLICY "Payment participants can update payment status" ON public.payments
    FOR UPDATE USING (from_user = auth.uid() OR to_user = auth.uid());

-- Insérer les catégories par défaut
INSERT INTO public.expense_categories (name, icon, color, is_default) VALUES
    ('Nourriture & Boissons', 'utensils', '#FF6B6B', true),
    ('Transport', 'car', '#4ECDC4', true),
    ('Logement', 'home', '#45B7D1', true),
    ('Divertissement', 'music', '#96CEB4', true),
    ('Shopping', 'shopping-bag', '#DDA0DD', true),
    ('Utilitaires', 'zap', '#FFD93D', true),
    ('Santé', 'heart', '#FF8C94', true),
    ('Autre', 'circle', '#B0B0B0', true)
ON CONFLICT DO NOTHING;

-- Créer les triggers pour la mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Donner les permissions appropriées
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated;
