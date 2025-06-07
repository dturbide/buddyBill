-- =====================================================
-- RESTAURATION DU SCHÉMA APP POUR BUDDYBALL
-- À exécuter dans Supabase SQL Editor pour restaurer le schéma app
-- =====================================================

-- 1. Créer le schéma app s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS app;

-- 2. Créer les types enum nécessaires
DO $$ 
BEGIN
    -- Type pour les devises
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')) THEN
        CREATE TYPE app.currency_type AS ENUM ('USD', 'EUR', 'CAD', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL');
    END IF;

    -- Type pour les rôles dans un groupe (note: les groupes sont maintenant dans public, mais on garde ce type au cas où)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')) THEN
        CREATE TYPE app.group_member_role AS ENUM ('admin', 'member');
    END IF;

    -- Type pour le statut des dépenses
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')) THEN
        CREATE TYPE app.expense_status AS ENUM ('pending', 'approved', 'rejected', 'settled');
    END IF;

    -- Type pour le type de partage
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_split_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')) THEN
        CREATE TYPE app.expense_split_type AS ENUM ('equal', 'percentage', 'shares', 'custom');
    END IF;

    -- Type pour le statut des paiements
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')) THEN
        CREATE TYPE app.payment_status AS ENUM ('pending', 'confirmed', 'rejected');
    END IF;
END $$;

-- 3. Créer la table des catégories de dépenses
CREATE TABLE IF NOT EXISTS app.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insérer les catégories par défaut si elles n'existent pas
INSERT INTO app.expense_categories (name, icon, color, is_default) 
SELECT * FROM (VALUES
    ('Nourriture', 'utensils', '#FF6B6B', true),
    ('Transport', 'car', '#4ECDC4', true),
    ('Logement', 'home', '#45B7D1', true),
    ('Divertissement', 'music', '#96CEB4', true),
    ('Shopping', 'shopping-bag', '#FECA57', true),
    ('Factures', 'file-text', '#DDA0DD', true),
    ('Santé', 'heart', '#FF6B9D', true),
    ('Autre', 'more-horizontal', '#95A5A6', true)
) AS v(name, icon, color, is_default)
WHERE NOT EXISTS (
    SELECT 1 FROM app.expense_categories WHERE name = v.name
);

-- 5. Créer la table des dépenses
CREATE TABLE IF NOT EXISTS app.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Créer la table des participants aux dépenses
CREATE TABLE IF NOT EXISTS app.expense_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES app.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    share_amount DECIMAL(12,2),
    share_percentage DECIMAL(5,2),
    share_count INTEGER,
    is_settled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(expense_id, user_id)
);

-- 7. Créer la table des paiements
CREATE TABLE IF NOT EXISTS app.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    to_user_id UUID NOT NULL REFERENCES public.user_profiles(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency app.currency_type NOT NULL,
    description TEXT,
    status app.payment_status DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON app.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON app.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON app.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON app.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON app.expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON app.payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user_id ON app.payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user_id ON app.payments(to_user_id);

-- 9. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON app.expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON app.expenses
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON app.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON app.payments
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- 10. Activer RLS sur toutes les tables
ALTER TABLE app.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.payments ENABLE ROW LEVEL SECURITY;

-- 11. Politiques RLS pour les catégories de dépenses (lecture pour tous les utilisateurs authentifiés)
DROP POLICY IF EXISTS "All authenticated users can view expense categories" ON app.expense_categories;
CREATE POLICY "All authenticated users can view expense categories"
  ON app.expense_categories FOR SELECT
  TO authenticated
  USING (true);

-- 12. Politiques RLS pour les dépenses
DROP POLICY IF EXISTS "Users can view expenses from their groups" ON app.expenses;
CREATE POLICY "Users can view expenses from their groups"
  ON app.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = expenses.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Group members can create expenses" ON app.expenses;
CREATE POLICY "Group members can create expenses"
  ON app.expenses FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = expenses.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Expense creators and group admins can update expenses" ON app.expenses;
CREATE POLICY "Expense creators and group admins can update expenses"
  ON app.expenses FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = expenses.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin' 
      AND gm.left_at IS NULL
    )
  );

-- 13. Politiques RLS pour les participants aux dépenses
DROP POLICY IF EXISTS "Users can view expense participants for their groups" ON app.expense_participants;
CREATE POLICY "Users can view expense participants for their groups"
  ON app.expense_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.expenses e
      JOIN public.group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_participants.expense_id
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Group members can manage expense participants" ON app.expense_participants;
CREATE POLICY "Group members can manage expense participants"
  ON app.expense_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app.expenses e
      JOIN public.group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_participants.expense_id
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

-- 14. Politiques RLS pour les paiements
DROP POLICY IF EXISTS "Users can view payments for their groups" ON app.payments;
CREATE POLICY "Users can view payments for their groups"
  ON app.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = payments.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Group members can create payments" ON app.payments;
CREATE POLICY "Group members can create payments"
  ON app.payments FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = payments.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

-- 15. Fonction utilitaire pour calculer la balance d'un utilisateur dans un groupe
CREATE OR REPLACE FUNCTION app.get_user_balance_in_group(p_user_id UUID, p_group_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_paid DECIMAL(12,2) := 0;
    total_owed DECIMAL(12,2) := 0;
    balance DECIMAL(12,2) := 0;
BEGIN
    -- Calculer le total payé par l'utilisateur
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM app.expenses
    WHERE paid_by = p_user_id 
    AND group_id = p_group_id 
    AND status != 'rejected';

    -- Calculer le total dû par l'utilisateur
    SELECT COALESCE(SUM(ep.share_amount), 0) INTO total_owed
    FROM app.expense_participants ep
    JOIN app.expenses e ON e.id = ep.expense_id
    WHERE ep.user_id = p_user_id 
    AND e.group_id = p_group_id 
    AND e.status != 'rejected';

    -- Calculer la balance (positif = créditeur, négatif = débiteur)
    balance := total_paid - total_owed;

    RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Donner les permissions nécessaires
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA app TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Schéma app restauré avec succès!';
    RAISE NOTICE 'Tables créées: expense_categories, expenses, expense_participants, payments';
    RAISE NOTICE 'Fonction utilitaire: app.get_user_balance_in_group()';
END $$;
