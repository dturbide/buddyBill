-- Script simple pour ajouter seulement les colonnes manquantes

-- 1. Ajouter les colonnes manquantes à payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payer_id UUID;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS recipient_id UUID;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS group_id UUID;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 2. Créer la table expense_participants si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    share_amount DECIMAL(10,2),
    share_percentage DECIMAL(5,2),
    share_count INTEGER,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ajouter quelques données de test
INSERT INTO public.expense_participants (expense_id, user_id, share_amount, is_settled)
SELECT 
    e.id as expense_id,
    e.created_by as user_id,
    e.amount as share_amount,
    false as is_settled
FROM public.expenses e
WHERE NOT EXISTS (
    SELECT 1 FROM public.expense_participants ep 
    WHERE ep.expense_id = e.id AND ep.user_id = e.created_by
)
LIMIT 10
ON CONFLICT DO NOTHING;

SELECT 'Colonnes ajoutées avec succès!' as status;
