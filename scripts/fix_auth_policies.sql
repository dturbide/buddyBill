-- Script pour corriger les problèmes d'authentification
-- À exécuter dans Supabase SQL Editor

DO $$ 
BEGIN
    RAISE NOTICE 'Début de la correction des politiques d''authentification...';

    -- 1. S'assurer que RLS est activé sur user_profiles
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

    -- 2. Supprimer les anciennes politiques si elles existent
    DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;

    -- 3. Créer de nouvelles politiques pour user_profiles
    CREATE POLICY "Users can view own profile" 
    ON public.user_profiles FOR SELECT 
    USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" 
    ON public.user_profiles FOR UPDATE 
    USING (auth.uid() = id);

    CREATE POLICY "Enable insert for authenticated users" 
    ON public.user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

    -- 4. Vérifier et corriger les autres tables importantes
    ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

    -- 5. Politique pour groups (via group_members)
    DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
    CREATE POLICY "Users can view groups they belong to" 
    ON public.groups FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = groups.id 
            AND user_id = auth.uid()
        )
    );

    -- 6. Politique pour group_members
    DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_members;
    CREATE POLICY "Users can view their own memberships" 
    ON public.group_members FOR SELECT 
    USING (user_id = auth.uid());

    -- 7. Politique pour expenses (via group_members)
    DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses;
    CREATE POLICY "Users can view expenses from their groups" 
    ON public.expenses FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = expenses.group_id 
            AND user_id = auth.uid()
        )
    );

    -- 8. Politique pour expense_participants
    DROP POLICY IF EXISTS "Users can view participants from their expenses" ON public.expense_participants;
    CREATE POLICY "Users can view participants from their expenses" 
    ON public.expense_participants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

    RAISE NOTICE 'Correction des politiques d''authentification terminée avec succès !';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERREUR lors de la correction: %', SQLERRM;
        RAISE EXCEPTION 'Correction échouée: %', SQLERRM;
END $$;
