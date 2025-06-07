-- Script pour corriger la table payments et ajouter les colonnes manquantes

-- 1. Vérifier d'abord la structure actuelle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes à la table payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payer_id UUID;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS recipient_id UUID;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS group_id UUID;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled'));

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- 3. Ajouter les contraintes de clés étrangères
ALTER TABLE public.payments 
ADD CONSTRAINT IF NOT EXISTS payments_payer_id_fkey 
FOREIGN KEY (payer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
ADD CONSTRAINT IF NOT EXISTS payments_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
ADD CONSTRAINT IF NOT EXISTS payments_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- 4. Vérifier la structure finale
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- 5. Créer la table expense_participants si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    share_amount DECIMAL(10,2),
    share_percentage DECIMAL(5,2),
    share_count INTEGER,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT expense_participants_expense_id_fkey 
        FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE,
    CONSTRAINT expense_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT expense_participants_unique 
        UNIQUE (expense_id, user_id)
);

-- 6. Ajouter quelques données de test pour expense_participants si elles n'existent pas
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
LIMIT 20;

SELECT 'Tables payments et expense_participants corrigées avec succès!' as status;
