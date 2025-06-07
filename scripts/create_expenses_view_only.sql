-- Vue pour les dépenses seulement (sans les participants pour l'instant)
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

-- Activer RLS sur ces vues
ALTER TABLE public.expenses_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories_view ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour expenses_view (basées sur l'appartenance aux groupes)
DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses_view;
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
DROP POLICY IF EXISTS "Anyone can view expense categories" ON public.expense_categories_view;
CREATE POLICY "Anyone can view expense categories" ON public.expense_categories_view
    FOR SELECT USING (true);
