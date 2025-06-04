-- =====================================================
-- EXPENSE SHARING APP - TRIGGERS ET VUES
-- Script 004: Triggers automatiques et vues utiles
-- =====================================================

-- 1. Triggers pour logging automatique des activités

-- 1.1 Trigger pour création de groupe
CREATE OR REPLACE FUNCTION app.trigger_log_group_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM app.log_activity(
        NEW.created_by,
        'group_created'::app.activity_type,
        NEW.id,
        'group',
        NEW.id,
        jsonb_build_object(
            'group_name', NEW.name,
            'group_type', NEW.type
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_group_creation
    AFTER INSERT ON app.groups
    FOR EACH ROW
    EXECUTE FUNCTION app.trigger_log_group_creation();

-- 1.2 Trigger pour création de dépense
CREATE OR REPLACE FUNCTION app.trigger_log_expense_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM app.log_activity(
        NEW.created_by,
        'expense_created'::app.activity_type,
        NEW.group_id,
        'expense',
        NEW.id,
        jsonb_build_object(
            'description', NEW.description,
            'amount', NEW.amount,
            'currency', NEW.currency
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_expense_creation
    AFTER INSERT ON app.expenses
    FOR EACH ROW
    EXECUTE FUNCTION app.trigger_log_expense_creation();

-- 1.3 Trigger pour mise à jour des balances après une dépense
CREATE OR REPLACE FUNCTION app.trigger_update_balances_on_expense()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les balances seulement si la dépense est approuvée
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        PERFORM app.update_group_balances(NEW.group_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_balances_on_expense
    AFTER INSERT OR UPDATE ON app.expenses
    FOR EACH ROW
    EXECUTE FUNCTION app.trigger_update_balances_on_expense();

-- 1.4 Trigger pour mise à jour des balances après un paiement
CREATE OR REPLACE FUNCTION app.trigger_update_balances_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les balances seulement si le paiement est complété
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM app.update_group_balances(NEW.group_id);
        
        -- Logger l'activité pour les deux utilisateurs
        PERFORM app.log_activity(
            NEW.from_user_id,
            'payment_made'::app.activity_type,
            NEW.group_id,
            'payment',
            NEW.id,
            jsonb_build_object(
                'to_user', NEW.to_user_id,
                'amount', NEW.amount,
                'currency', NEW.currency
            )
        );
        
        PERFORM app.log_activity(
            NEW.to_user_id,
            'payment_received'::app.activity_type,
            NEW.group_id,
            'payment',
            NEW.id,
            jsonb_build_object(
                'from_user', NEW.from_user_id,
                'amount', NEW.amount,
                'currency', NEW.currency
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_balances_on_payment
    AFTER INSERT OR UPDATE ON app.payments
    FOR EACH ROW
    EXECUTE FUNCTION app.trigger_update_balances_on_payment();

-- 1.5 Trigger pour ajouter automatiquement le créateur comme admin du groupe
CREATE OR REPLACE FUNCTION app.trigger_add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO app.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER add_creator_as_admin
    AFTER INSERT ON app.groups
    FOR EACH ROW
    EXECUTE FUNCTION app.trigger_add_creator_as_admin();

-- 2. Vues utiles

-- 2.1 Vue des groupes avec statistiques
CREATE OR REPLACE VIEW app.groups_with_stats AS
SELECT 
    g.*,
    COUNT(DISTINCT gm.user_id) as member_count,
    COUNT(DISTINCT e.id) as expense_count,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    MAX(e.created_at) as last_activity
FROM app.groups g
LEFT JOIN app.group_members gm ON g.id = gm.group_id AND gm.left_at IS NULL
LEFT JOIN app.expenses e ON g.id = e.group_id AND e.status = 'approved'
GROUP BY g.id;

-- 2.2 Vue des dépenses détaillées
CREATE OR REPLACE VIEW app.expenses_detailed AS
SELECT 
    e.*,
    up.full_name as paid_by_name,
    NULL as paid_by_avatar, 
    cat.name as category_name,
    cat.icon as category_icon,
    cat.color as category_color,
    g.name as group_name,
    (
        SELECT COUNT(*) 
        FROM app.expense_participants ep 
        WHERE ep.expense_id = e.id
    ) as participant_count,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'user_id', ep.user_id,
                'user_name', u.full_name,
                'amount_owed', ep.amount_owed,
                'is_settled', ep.is_settled
            )
        )
        FROM app.expense_participants ep
        JOIN public.user_profiles u ON u.id = ep.user_id
        WHERE ep.expense_id = e.id
    ) as participants
FROM app.expenses e
LEFT JOIN public.user_profiles up ON up.id = e.paid_by
LEFT JOIN app.expense_categories cat ON cat.id = e.category_id
LEFT JOIN app.groups g ON g.id = e.group_id;

-- 2.3 Vue des balances détaillées par groupe
CREATE OR REPLACE VIEW app.balances_detailed AS
SELECT 
    gb.*,
    u.full_name as user_name,
    NULL as user_avatar, 
    g.name as group_name,
    CASE 
        WHEN gb.balance > 0 THEN 'creditor'
        WHEN gb.balance < 0 THEN 'debtor'
        ELSE 'settled'
    END as balance_type
FROM app.group_balances gb
JOIN public.user_profiles u ON u.id = gb.user_id
JOIN app.groups g ON g.id = gb.group_id;

-- 2.4 Vue des paiements avec détails utilisateurs
CREATE OR REPLACE VIEW app.payments_detailed AS
SELECT 
    p.*,
    uf.full_name as from_user_name,
    NULL as from_user_avatar, 
    ut.full_name as to_user_name,
    NULL as to_user_avatar, 
    g.name as group_name
FROM app.payments p
JOIN public.user_profiles uf ON uf.id = p.from_user_id
JOIN public.user_profiles ut ON ut.id = p.to_user_id
JOIN app.groups g ON g.id = p.group_id;

-- 2.5 Vue du tableau de bord utilisateur
CREATE OR REPLACE VIEW app.user_dashboard AS
WITH user_groups AS (
    SELECT 
        gm.user_id,
        COUNT(DISTINCT gm.group_id) as active_groups
    FROM app.group_members gm
    WHERE gm.left_at IS NULL
    GROUP BY gm.user_id
),
user_balances AS (
    SELECT 
        gb.user_id,
        SUM(CASE WHEN gb.balance > 0 THEN gb.balance ELSE 0 END) as total_owed_to_you,
        SUM(CASE WHEN gb.balance < 0 THEN ABS(gb.balance) ELSE 0 END) as total_you_owe
    FROM app.group_balances gb
    GROUP BY gb.user_id
),
user_expenses AS (
    SELECT 
        ep.user_id,
        COUNT(DISTINCT e.id) as pending_expenses,
        SUM(CASE 
            WHEN e.expense_date >= DATE_TRUNC('month', CURRENT_DATE) 
            THEN ep.amount_owed 
            ELSE 0 
        END) as month_expenses
    FROM app.expense_participants ep
    JOIN app.expenses e ON e.id = ep.expense_id
    WHERE e.status = 'approved'
    GROUP BY ep.user_id
)
SELECT 
    u.id as user_id,
    u.full_name,
    NULL as avatar_url, 
    COALESCE(ug.active_groups, 0) as active_groups,
    COALESCE(ub.total_owed_to_you, 0) as total_owed_to_you,
    COALESCE(ub.total_you_owe, 0) as total_you_owe,
    COALESCE(ue.pending_expenses, 0) as pending_expenses,
    COALESCE(ue.month_expenses, 0) as month_expenses
FROM public.user_profiles u
LEFT JOIN user_groups ug ON ug.user_id = u.id
LEFT JOIN user_balances ub ON ub.user_id = u.id
LEFT JOIN user_expenses ue ON ue.user_id = u.id;

-- 3. Fonctions pour simplifier les requêtes courantes

-- 3.1 Fonction pour obtenir les membres d'un groupe avec leurs balances
CREATE OR REPLACE FUNCTION app.get_group_members_with_balances(p_group_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    role app.group_member_role,
    balance DECIMAL(12,2),
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gm.user_id,
        u.full_name,
        NULL::TEXT as avatar_url, 
        gm.role,
        COALESCE(gb.balance, 0) as balance,
        gm.joined_at
    FROM app.group_members gm
    JOIN public.user_profiles u ON u.id = gm.user_id
    LEFT JOIN app.group_balances gb ON gb.user_id = gm.user_id AND gb.group_id = p_group_id
    WHERE gm.group_id = p_group_id
      AND gm.left_at IS NULL
    ORDER BY gm.role, u.full_name;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Fonction pour obtenir les statistiques d'un groupe
CREATE OR REPLACE FUNCTION app.get_group_statistics(p_group_id UUID)
RETURNS TABLE (
    total_expenses DECIMAL(12,2),
    average_expense DECIMAL(12,2),
    largest_expense DECIMAL(12,2),
    total_payments DECIMAL(12,2),
    member_count INTEGER,
    expense_count INTEGER,
    payment_count INTEGER,
    unsettled_amount DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(AVG(e.amount), 0) as average_expense,
        COALESCE(MAX(e.amount), 0) as largest_expense,
        COALESCE((
            SELECT SUM(amount) 
            FROM app.payments 
            WHERE group_id = p_group_id AND status = 'completed'
        ), 0) as total_payments,
        (SELECT COUNT(*)::INTEGER FROM app.group_members WHERE group_id = p_group_id AND left_at IS NULL) as member_count,
        COUNT(e.id)::INTEGER as expense_count,
        (SELECT COUNT(*)::INTEGER FROM app.payments WHERE group_id = p_group_id) as payment_count,
        COALESCE((
            SELECT SUM(ABS(balance)) 
            FROM app.group_balances 
            WHERE group_id = p_group_id
        ) / 2, 0) as unsettled_amount
    FROM app.expenses e
    WHERE e.group_id = p_group_id
      AND e.status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- 4. Permissions sur les vues
GRANT SELECT ON app.groups_with_stats TO authenticated;
GRANT SELECT ON app.expenses_detailed TO authenticated;
GRANT SELECT ON app.balances_detailed TO authenticated;
GRANT SELECT ON app.payments_detailed TO authenticated;
GRANT SELECT ON app.user_dashboard TO authenticated;

-- 5. Index supplémentaires pour optimisation
CREATE INDEX idx_expenses_status ON app.expenses(status);
CREATE INDEX idx_expenses_created_at ON app.expenses(created_at DESC);
CREATE INDEX idx_payments_status ON app.payments(status);
CREATE INDEX idx_group_invitations_token ON app.group_invitations(token);
CREATE INDEX idx_group_invitations_email ON app.group_invitations(email);
CREATE INDEX idx_activity_log_entity ON app.activity_log(entity_type, entity_id);
