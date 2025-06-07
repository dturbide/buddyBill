-- Script pour corriger les politiques RLS et éviter la récursion infinie

-- 1. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Everyone can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Only system can manage expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view expenses in their groups" ON public.expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense creator can update their expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view expense participants in their groups" ON public.expense_participants;
DROP POLICY IF EXISTS "Expense creator can manage participants" ON public.expense_participants;
DROP POLICY IF EXISTS "Users can view payments in their groups" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments they make" ON public.payments;
DROP POLICY IF EXISTS "Payment participants can update payment status" ON public.payments;

-- 2. Désactiver temporairement RLS pour permettre les insertions initiales
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- 3. Créer des politiques RLS simplifiées sans récursion

-- Politiques pour groups
-- Permettre à tous les utilisateurs authentifiés de créer des groupes
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Permettre de voir les groupes où l'utilisateur est membre (sans récursion)
CREATE POLICY "Users can view their groups" ON public.groups
    FOR SELECT 
    TO authenticated
    USING (
        id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Permettre aux admins de mettre à jour leurs groupes
CREATE POLICY "Group admins can update" ON public.groups
    FOR UPDATE 
    TO authenticated
    USING (
        id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politiques pour group_members
-- Permettre de voir les membres des groupes dont on fait partie
CREATE POLICY "View group members" ON public.group_members
    FOR SELECT 
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id 
            FROM public.group_members AS gm2
            WHERE gm2.user_id = auth.uid()
        )
    );

-- Permettre l'insertion lors de la création d'un groupe (le créateur s'ajoute comme admin)
CREATE POLICY "Group creator can add themselves" ON public.group_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        AND invited_by = auth.uid()
        AND group_id IN (
            SELECT id FROM public.groups 
            WHERE created_by = auth.uid()
        )
    );

-- Permettre aux admins d'ajouter des membres
CREATE POLICY "Group admins can add members" ON public.group_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        invited_by = auth.uid()
        AND group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Politiques pour expense_categories (lecture publique)
CREATE POLICY "Public read expense categories" ON public.expense_categories
    FOR SELECT 
    TO authenticated
    USING (true);

-- Politiques pour expenses
CREATE POLICY "View group expenses" ON public.expenses
    FOR SELECT 
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Create expenses in member groups" ON public.expenses
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        paid_by = auth.uid()
        AND group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Update own expenses" ON public.expenses
    FOR UPDATE 
    TO authenticated
    USING (paid_by = auth.uid());

-- Politiques pour expense_participants
CREATE POLICY "View expense participants" ON public.expense_participants
    FOR SELECT 
    TO authenticated
    USING (
        expense_id IN (
            SELECT id 
            FROM public.expenses 
            WHERE group_id IN (
                SELECT group_id 
                FROM public.group_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Manage own expense participants" ON public.expense_participants
    FOR ALL 
    TO authenticated
    USING (
        expense_id IN (
            SELECT id 
            FROM public.expenses 
            WHERE paid_by = auth.uid()
        )
    );

-- Politiques pour payments
CREATE POLICY "View group payments" ON public.payments
    FOR SELECT 
    TO authenticated
    USING (
        group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Create own payments" ON public.payments
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        from_user = auth.uid()
        AND group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Update payment status" ON public.payments
    FOR UPDATE 
    TO authenticated
    USING (from_user = auth.uid() OR to_user = auth.uid());

-- 4. Réactiver RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier les politiques
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments')
ORDER BY tablename, policyname;
