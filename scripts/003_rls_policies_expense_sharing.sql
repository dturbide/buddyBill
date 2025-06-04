-- =====================================================
-- EXPENSE SHARING APP - POLITIQUES RLS
-- Script 003: Row Level Security pour toutes les tables
-- =====================================================

-- 1. Activer RLS sur toutes les tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.group_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.group_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Politiques pour user_profiles
-- Lecture: tout le monde peut voir les profils des membres de ses groupes
CREATE POLICY "users_can_view_group_members_profiles" ON public.user_profiles
    FOR SELECT
    USING (
        id = auth.uid() OR
        id IN (
            SELECT DISTINCT gm2.user_id 
            FROM app.group_members gm1
            JOIN app.group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = auth.uid() 
              AND gm1.left_at IS NULL
              AND gm2.left_at IS NULL
        )
    );

-- Insertion: seulement lors de la création de compte
CREATE POLICY "users_can_insert_own_profile" ON public.user_profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- Mise à jour: seulement son propre profil
CREATE POLICY "users_can_update_own_profile" ON public.user_profiles
    FOR UPDATE
    USING (id = auth.uid());

-- 3. Politiques pour groups
-- Lecture: membres du groupe seulement
CREATE POLICY "members_can_view_groups" ON app.groups
    FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Insertion: tout utilisateur authentifié peut créer un groupe
CREATE POLICY "authenticated_users_can_create_groups" ON app.groups
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        created_by = auth.uid()
    );

-- Mise à jour: seulement les admins du groupe
CREATE POLICY "admins_can_update_groups" ON app.groups
    FOR UPDATE
    USING (
        id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() 
              AND role = 'admin'
              AND left_at IS NULL
        )
    );

-- Suppression: seulement le créateur du groupe
CREATE POLICY "creator_can_delete_group" ON app.groups
    FOR DELETE
    USING (created_by = auth.uid());

-- 4. Politiques pour group_members
-- Lecture: membres du même groupe
CREATE POLICY "members_can_view_group_members" ON app.group_members
    FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Insertion: admins peuvent ajouter des membres
CREATE POLICY "admins_can_add_members" ON app.group_members
    FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() 
              AND role = 'admin'
              AND left_at IS NULL
        )
    );

-- Mise à jour: admins peuvent modifier les rôles, membres peuvent se retirer
CREATE POLICY "members_can_update_membership" ON app.group_members
    FOR UPDATE
    USING (
        -- Admin peut modifier n'importe quel membre
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() 
              AND role = 'admin'
              AND left_at IS NULL
        )
        OR
        -- Membre peut se retirer (mettre left_at)
        (user_id = auth.uid() AND left_at IS NULL)
    );

-- 5. Politiques pour expense_categories
-- Lecture: tout le monde
CREATE POLICY "everyone_can_view_categories" ON app.expense_categories
    FOR SELECT
    USING (true);

-- 6. Politiques pour expenses
-- Lecture: membres du groupe
CREATE POLICY "members_can_view_expenses" ON app.expenses
    FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Insertion: membres du groupe
CREATE POLICY "members_can_create_expenses" ON app.expenses
    FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
        AND created_by = auth.uid()
    );

-- Mise à jour: créateur de la dépense ou admin du groupe
CREATE POLICY "users_can_update_expenses" ON app.expenses
    FOR UPDATE
    USING (
        created_by = auth.uid()
        OR
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() 
              AND role = 'admin'
              AND left_at IS NULL
        )
    );

-- Suppression: créateur de la dépense seulement si pas encore approuvée
CREATE POLICY "creator_can_delete_pending_expense" ON app.expenses
    FOR DELETE
    USING (
        created_by = auth.uid() 
        AND status = 'pending'
    );

-- 7. Politiques pour expense_participants
-- Lecture: membres du groupe de la dépense
CREATE POLICY "members_can_view_participants" ON app.expense_participants
    FOR SELECT
    USING (
        expense_id IN (
            SELECT id FROM app.expenses
            WHERE group_id IN (
                SELECT group_id FROM app.group_members
                WHERE user_id = auth.uid() AND left_at IS NULL
            )
        )
    );

-- Insertion/Mise à jour: créateur de la dépense ou admin
CREATE POLICY "expense_creator_can_manage_participants" ON app.expense_participants
    FOR INSERT
    WITH CHECK (
        expense_id IN (
            SELECT id FROM app.expenses
            WHERE created_by = auth.uid()
               OR group_id IN (
                   SELECT group_id FROM app.group_members
                   WHERE user_id = auth.uid() 
                     AND role = 'admin'
                     AND left_at IS NULL
               )
        )
    );

CREATE POLICY "expense_creator_can_update_participants" ON app.expense_participants
    FOR UPDATE
    USING (
        expense_id IN (
            SELECT id FROM app.expenses
            WHERE created_by = auth.uid()
               OR group_id IN (
                   SELECT group_id FROM app.group_members
                   WHERE user_id = auth.uid() 
                     AND role = 'admin'
                     AND left_at IS NULL
               )
        )
    );

-- 8. Politiques pour payments
-- Lecture: participants du paiement ou membres du groupe
CREATE POLICY "users_can_view_payments" ON app.payments
    FOR SELECT
    USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Insertion: l'émetteur du paiement
CREATE POLICY "users_can_create_payments" ON app.payments
    FOR INSERT
    WITH CHECK (
        from_user_id = auth.uid()
        AND group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Mise à jour: l'émetteur ou le receveur (pour confirmer)
CREATE POLICY "payment_parties_can_update" ON app.payments
    FOR UPDATE
    USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
    );

-- 9. Politiques pour group_balances
-- Lecture seulement: membres du groupe
CREATE POLICY "members_can_view_balances" ON app.group_balances
    FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Les balances sont gérées par les fonctions système uniquement

-- 10. Politiques pour activity_log
-- Lecture: activités de ses groupes
CREATE POLICY "users_can_view_activities" ON app.activity_log
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Insertion: gérée par les fonctions système

-- 11. Politiques pour group_invitations
-- Lecture: créateur de l'invitation ou email correspond
CREATE POLICY "users_can_view_invitations" ON app.group_invitations
    FOR SELECT
    USING (
        invited_by = auth.uid()
        OR email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

-- Insertion: admins du groupe
CREATE POLICY "admins_can_create_invitations" ON app.group_invitations
    FOR INSERT
    WITH CHECK (
        invited_by = auth.uid()
        AND group_id IN (
            SELECT group_id FROM app.group_members
            WHERE user_id = auth.uid() 
              AND role = 'admin'
              AND left_at IS NULL
        )
    );

-- Mise à jour: pour accepter/refuser l'invitation
CREATE POLICY "users_can_update_own_invitations" ON app.group_invitations
    FOR UPDATE
    USING (
        email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

-- 12. Politiques spéciales pour les fonctions
-- Donner les permissions EXECUTE aux fonctions publiques
GRANT EXECUTE ON FUNCTION app.calculate_group_balances TO authenticated;
GRANT EXECUTE ON FUNCTION app.update_group_balances TO authenticated;
GRANT EXECUTE ON FUNCTION app.split_expense_equally TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_simplified_debts TO authenticated;
GRANT EXECUTE ON FUNCTION app.log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_user_summary TO authenticated;
GRANT EXECUTE ON FUNCTION app.accept_group_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_recent_activities TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_current_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_monthly_expenses TO authenticated;
