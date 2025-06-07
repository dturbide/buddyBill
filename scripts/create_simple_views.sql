-- Vue simplifiée pour les dépenses (colonnes de base seulement)
CREATE OR REPLACE VIEW public.expenses_view AS
SELECT 
    id,
    description,
    amount,
    currency,
    expense_date,
    group_id,
    created_at
FROM app.expenses;

-- Activer RLS sur la vue
ALTER TABLE public.expenses_view ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour expenses_view (basée sur l'appartenance aux groupes)
CREATE POLICY "Users can view expenses from their groups" ON public.expenses_view
    FOR SELECT USING (
        group_id IN (
            SELECT gm.group_id 
            FROM group_members gm 
            WHERE gm.user_id = auth.uid() 
            AND gm.left_at IS NULL
        )
    );
