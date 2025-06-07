-- Script pour réactiver RLS avec des politiques sûres et sans récursion

-- 1. D'abord, vérifier qu'il y a bien des groupes et membres dans la base
SELECT 'Groupes existants:' as info;
SELECT id, name, created_by, created_at FROM public.groups;

SELECT 'Membres des groupes:' as info;
SELECT gm.*, g.name as group_name 
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id;

-- 2. Activer RLS sur toutes les tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Créer des politiques RLS sûres et fonctionnelles

-- GROUPS - Politiques simples
-- Permettre à tous les utilisateurs authentifiés de créer des groupes
CREATE POLICY "groups_insert_policy" ON public.groups
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Permettre de voir les groupes où l'utilisateur est membre (sans JOIN récursif)
CREATE POLICY "groups_select_policy" ON public.groups
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.group_members gm
            WHERE gm.group_id = groups.id 
            AND gm.user_id = auth.uid()
        )
    );

-- Permettre aux admins de mettre à jour leurs groupes
CREATE POLICY "groups_update_policy" ON public.groups
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.group_members gm
            WHERE gm.group_id = groups.id 
            AND gm.user_id = auth.uid() 
            AND gm.role = 'admin'
        )
    );

-- GROUP_MEMBERS - Politiques simples
-- Permettre de voir tous les membres des groupes auxquels on appartient
CREATE POLICY "group_members_select_policy" ON public.group_members
    FOR SELECT 
    TO authenticated
    USING (
        group_id IN (
            SELECT DISTINCT gm2.group_id 
            FROM public.group_members gm2
            WHERE gm2.user_id = auth.uid()
        )
    );

-- Permettre au créateur d'un groupe de s'ajouter comme admin
CREATE POLICY "group_members_insert_self_policy" ON public.group_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- Soit on s'ajoute soi-même lors de la création
        (user_id = auth.uid() AND invited_by = auth.uid())
        OR
        -- Soit on est admin du groupe et on invite quelqu'un
        (
            invited_by = auth.uid() 
            AND EXISTS (
                SELECT 1 
                FROM public.group_members existing
                WHERE existing.group_id = group_members.group_id 
                AND existing.user_id = auth.uid() 
                AND existing.role = 'admin'
            )
        )
    );

-- Permettre aux admins de gérer les membres
CREATE POLICY "group_members_update_policy" ON public.group_members
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.group_members admin_check
            WHERE admin_check.group_id = group_members.group_id 
            AND admin_check.user_id = auth.uid() 
            AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "group_members_delete_policy" ON public.group_members
    FOR DELETE 
    TO authenticated
    USING (
        -- Admin peut supprimer des membres
        EXISTS (
            SELECT 1 
            FROM public.group_members admin_check
            WHERE admin_check.group_id = group_members.group_id 
            AND admin_check.user_id = auth.uid() 
            AND admin_check.role = 'admin'
        )
        OR
        -- Un membre peut se retirer lui-même
        user_id = auth.uid()
    );

-- EXPENSE_CATEGORIES - Lecture publique
CREATE POLICY "expense_categories_select_policy" ON public.expense_categories
    FOR SELECT 
    TO authenticated
    USING (true);

-- EXPENSES - Politiques pour les membres du groupe
CREATE POLICY "expenses_select_policy" ON public.expenses
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.group_members gm
            WHERE gm.group_id = expenses.group_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "expenses_insert_policy" ON public.expenses
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        paid_by = auth.uid() 
        AND EXISTS (
            SELECT 1 
            FROM public.group_members gm
            WHERE gm.group_id = expenses.group_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "expenses_update_policy" ON public.expenses
    FOR UPDATE 
    TO authenticated
    USING (paid_by = auth.uid());

CREATE POLICY "expenses_delete_policy" ON public.expenses
    FOR DELETE 
    TO authenticated
    USING (paid_by = auth.uid());

-- EXPENSE_PARTICIPANTS - Politiques liées aux dépenses
CREATE POLICY "expense_participants_select_policy" ON public.expense_participants
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "expense_participants_insert_policy" ON public.expense_participants
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.expenses e
            WHERE e.id = expense_participants.expense_id 
            AND e.paid_by = auth.uid()
        )
    );

CREATE POLICY "expense_participants_update_policy" ON public.expense_participants
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.expenses e
            WHERE e.id = expense_participants.expense_id 
            AND e.paid_by = auth.uid()
        )
    );

CREATE POLICY "expense_participants_delete_policy" ON public.expense_participants
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.expenses e
            WHERE e.id = expense_participants.expense_id 
            AND e.paid_by = auth.uid()
        )
    );

-- PAYMENTS - Politiques pour les paiements
CREATE POLICY "payments_select_policy" ON public.payments
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.group_members gm
            WHERE gm.group_id = payments.group_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_insert_policy" ON public.payments
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        from_user = auth.uid() 
        AND EXISTS (
            SELECT 1 
            FROM public.group_members gm
            WHERE gm.group_id = payments.group_id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_update_policy" ON public.payments
    FOR UPDATE 
    TO authenticated
    USING (from_user = auth.uid() OR to_user = auth.uid());

-- 4. Vérifier que les politiques sont bien créées
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('groups', 'group_members', 'expenses', 'expense_participants', 'payments', 'expense_categories')
ORDER BY tablename, policyname;

-- 5. Tester la visibilité des groupes pour l'utilisateur actuel
SELECT 'Test de visibilité des groupes (devrait retourner des résultats):' as info;
SELECT g.*, gm.role 
FROM public.groups g
JOIN public.group_members gm ON gm.group_id = g.id
WHERE gm.user_id = auth.uid();
