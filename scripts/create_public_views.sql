-- Créer des vues dans le schéma public pour accéder aux données du schéma app

-- 1. Vue pour les dépenses
CREATE OR REPLACE VIEW public.expenses_view AS
SELECT 
    id,
    group_id,
    description,
    amount,
    currency,
    category_id,
    paid_by,
    expense_date,
    receipt_url,
    notes,
    status,
    split_type,
    created_by,
    created_at,
    updated_at
FROM app.expenses;

-- 2. Vue pour les catégories de dépenses
CREATE OR REPLACE VIEW public.expense_categories_view AS
SELECT 
    id,
    name,
    icon,
    color,
    created_at
FROM app.expense_categories;

-- 3. Vue pour les participants aux dépenses
CREATE OR REPLACE VIEW public.expense_participants_view AS
SELECT 
    id,
    expense_id,
    user_id,
    amount_owed,
    created_at
FROM app.expense_participants;

-- 4. Vue pour les paiements
CREATE OR REPLACE VIEW public.payments_view AS
SELECT 
    id,
    from_user_id,
    to_user_id,
    amount,
    currency,
    payment_date,
    group_id,
    description,
    created_at
FROM app.payments;

-- 5. Accorder les permissions RLS sur ces vues (même logique que les tables originales)
ALTER TABLE public.expenses_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_view ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour expenses_view (basées sur l'appartenance aux groupes)
CREATE POLICY "Users can view expenses from their groups" ON public.expenses_view
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id 
            FROM group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );

-- 7. Politique pour expense_categories_view (lecture publique)
CREATE POLICY "Anyone can view expense categories" ON public.expense_categories_view
    FOR SELECT USING (true);
