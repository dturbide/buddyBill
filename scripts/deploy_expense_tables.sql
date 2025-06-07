-- =====================================================
-- SCRIPT DE DÉPLOIEMENT DES TABLES EXPENSE SHARING
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- 1. Créer le schéma app s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS app;

-- 2. Créer les types enum nécessaires
DO $$ 
BEGIN
    -- Type pour les devises
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
        CREATE TYPE app.currency_type AS ENUM ('USD', 'EUR', 'CAD', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL');
    END IF;

    -- Type pour les rôles dans un groupe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role') THEN
        CREATE TYPE app.group_member_role AS ENUM ('admin', 'member');
    END IF;

    -- Type pour le statut des dépenses
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
        CREATE TYPE app.expense_status AS ENUM ('pending', 'approved', 'rejected', 'settled');
    END IF;

    -- Type pour le type de partage
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_split_type') THEN
        CREATE TYPE app.expense_split_type AS ENUM ('equal', 'percentage', 'shares', 'custom');
    END IF;

    -- Type pour le statut des paiements
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE app.payment_status AS ENUM ('pending', 'confirmed', 'rejected');
    END IF;
END $$;

-- 3. Créer la table des groupes
CREATE TABLE IF NOT EXISTS app.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    currency app.currency_type DEFAULT 'USD',
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- 4. Créer la table des membres de groupe
CREATE TABLE IF NOT EXISTS app.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role app.group_member_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES public.user_profiles(id),
    invitation_status TEXT DEFAULT 'accepted',
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- 5. Créer la table des catégories de dépenses
CREATE TABLE IF NOT EXISTS app.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insérer les catégories par défaut
INSERT INTO app.expense_categories (name, icon, color, is_default) VALUES
    ('Nourriture', 'utensils', '#FF6B6B', true),
    ('Transport', 'car', '#4ECDC4', true),
    ('Logement', 'home', '#45B7D1', true),
    ('Divertissement', 'music', '#96CEB4', true),
    ('Shopping', 'shopping-bag', '#FECA57', true),
    ('Factures', 'file-text', '#DDA0DD', true),
    ('Santé', 'heart', '#FF6B9D', true),
    ('Autre', 'more-horizontal', '#95A5A6', true)
ON CONFLICT DO NOTHING;

-- 7. Créer la table des dépenses
CREATE TABLE IF NOT EXISTS app.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency app.currency_type NOT NULL,
    category_id UUID REFERENCES app.expense_categories(id),
    paid_by UUID NOT NULL REFERENCES public.user_profiles(id),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    status app.expense_status DEFAULT 'pending',
    split_type app.expense_split_type DEFAULT 'equal',
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE
);

-- 8. Créer la table des participants aux dépenses
CREATE TABLE IF NOT EXISTS app.expense_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES app.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount_owed DECIMAL(12,2) NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2),
    shares INTEGER,
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(expense_id, user_id)
);

-- 9. Créer la table des paiements
CREATE TABLE IF NOT EXISTS app.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES app.groups(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    to_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency app.currency_type NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    status app.payment_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    CHECK (from_user_id != to_user_id)
);

-- 10. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON app.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON app.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON app.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON app.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON app.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON app.expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON app.payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user ON app.payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user ON app.payments(to_user_id);

-- 11. Activer RLS sur toutes les tables
ALTER TABLE app.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.payments ENABLE ROW LEVEL SECURITY;

-- 12. Politiques RLS pour les groupes
CREATE POLICY "Users can view groups they are members of" ON app.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()
            AND group_members.left_at IS NULL
        )
    );

CREATE POLICY "Users can create groups" ON app.groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups" ON app.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app.group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()
            AND group_members.role = 'admin'
            AND group_members.left_at IS NULL
        )
    );

-- 13. Politiques RLS pour les membres de groupe
CREATE POLICY "Users can view members of their groups" ON app.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.group_members gm
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid()
            AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Group admins can manage members" ON app.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app.group_members gm
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
            AND gm.left_at IS NULL
        )
    );

-- 14. Politiques RLS pour les catégories (lecture seule pour tous)
CREATE POLICY "Everyone can view expense categories" ON app.expense_categories
    FOR SELECT USING (true);

-- 15. Politiques RLS pour les dépenses
CREATE POLICY "Users can view expenses in their groups" ON app.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.group_members 
            WHERE group_members.group_id = expenses.group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.left_at IS NULL
        )
    );

CREATE POLICY "Group members can create expenses" ON app.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM app.group_members 
            WHERE group_members.group_id = expenses.group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.left_at IS NULL
        )
        AND auth.uid() = created_by
    );

CREATE POLICY "Expense creators can update their expenses" ON app.expenses
    FOR UPDATE USING (auth.uid() = created_by);

-- 16. Politiques RLS pour les participants aux dépenses
CREATE POLICY "Users can view expense participants in their groups" ON app.expense_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.expenses e
            JOIN app.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
            AND gm.left_at IS NULL
        )
    );

CREATE POLICY "Expense creators can manage participants" ON app.expense_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app.expenses e
            WHERE e.id = expense_participants.expense_id
            AND e.created_by = auth.uid()
        )
    );

-- 17. Politiques RLS pour les paiements
CREATE POLICY "Users can view payments in their groups" ON app.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.group_members 
            WHERE group_members.group_id = payments.group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.left_at IS NULL
        )
    );

CREATE POLICY "Users can create payments they are involved in" ON app.payments
    FOR INSERT WITH CHECK (
        auth.uid() IN (from_user_id, to_user_id)
        AND EXISTS (
            SELECT 1 FROM app.group_members 
            WHERE group_members.group_id = payments.group_id 
            AND group_members.user_id = auth.uid()
            AND group_members.left_at IS NULL
        )
    );

-- 18. Fonctions utilitaires
CREATE OR REPLACE FUNCTION app.get_user_balance_in_group(p_user_id UUID, p_group_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_total_paid DECIMAL := 0;
    v_total_owed DECIMAL := 0;
BEGIN
    -- Total payé par l'utilisateur
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM app.expenses
    WHERE group_id = p_group_id
    AND paid_by = p_user_id
    AND status IN ('approved', 'pending');

    -- Total dû par l'utilisateur
    SELECT COALESCE(SUM(amount_owed), 0) INTO v_total_owed
    FROM app.expense_participants ep
    JOIN app.expenses e ON e.id = ep.expense_id
    WHERE e.group_id = p_group_id
    AND ep.user_id = p_user_id
    AND ep.is_settled = false
    AND e.status IN ('approved', 'pending');

    RETURN v_total_paid - v_total_owed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Trigger pour auto-update du timestamp
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_groups_updated_at ON app.groups;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON app.expenses;

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON app.groups
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON app.expenses
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- 20. Permissions
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA app TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Tables de partage de dépenses créées avec succès!';
END $$;
