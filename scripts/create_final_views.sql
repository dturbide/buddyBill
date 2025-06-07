-- Vue pour les dépenses avec la vraie structure
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

-- Vue pour les catégories de dépenses
CREATE OR REPLACE VIEW public.expense_categories_view AS
SELECT 
    id,
    name,
    icon,
    color,
    created_at
FROM app.expense_categories;

-- Vue pour les participants aux dépenses avec la vraie structure
CREATE OR REPLACE VIEW public.expense_participants_view AS
SELECT 
    id,
    expense_id,
    user_id,
    share_amount,
    share_percentage,
    share_count,
    is_settled,
    created_at
FROM app.expense_participants;

-- Activer RLS sur ces vues
ALTER TABLE public.expenses_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants_view ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses_view;
DROP POLICY IF EXISTS "Anyone can view expense categories" ON public.expense_categories_view;
DROP POLICY IF EXISTS "Users can view expense participants from their groups" ON public.expense_participants_view;

-- Politiques RLS pour expenses_view (basées sur l'appartenance aux groupes)
CREATE POLICY "Users can view expenses from their groups" ON public.expenses_view
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id 
            FROM group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );

-- Politique pour expense_categories_view (lecture publique)
CREATE POLICY "Anyone can view expense categories" ON public.expense_categories_view
    FOR SELECT USING (true);

-- Politique pour expense_participants_view
CREATE POLICY "Users can view expense participants from their groups" ON public.expense_participants_view
    FOR SELECT USING (
        expense_id IN (
            SELECT e.id 
            FROM app.expenses e
            JOIN group_members gm ON e.group_id = gm.group_id
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );
