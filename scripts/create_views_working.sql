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

-- Les vues héritent automatiquement des politiques RLS des tables sous-jacentes
-- Donc pas besoin d'ALTER TABLE pour activer RLS sur les vues
