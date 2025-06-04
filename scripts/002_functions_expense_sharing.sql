-- =====================================================
-- EXPENSE SHARING APP - FONCTIONS
-- Script 002: Fonctions utilitaires et calculs
-- =====================================================

-- 1. Fonction pour calculer les balances d'un groupe
CREATE OR REPLACE FUNCTION app.calculate_group_balances(p_group_id UUID)
RETURNS TABLE (
    user_id UUID,
    balance DECIMAL(12,2),
    currency app.currency_type
) AS $$
DECLARE
    v_default_currency app.currency_type;
BEGIN
    -- Récupérer la devise par défaut du groupe
    SELECT default_currency INTO v_default_currency
    FROM app.groups
    WHERE id = p_group_id;

    RETURN QUERY
    WITH expense_debts AS (
        -- Ce que chaque utilisateur doit (négatif)
        SELECT 
            ep.user_id,
            -SUM(ep.amount_owed) as amount
        FROM app.expense_participants ep
        JOIN app.expenses e ON e.id = ep.expense_id
        WHERE e.group_id = p_group_id
          AND e.status = 'approved'
          AND NOT ep.is_settled
        GROUP BY ep.user_id
    ),
    expense_credits AS (
        -- Ce que chaque utilisateur a payé (positif)
        SELECT 
            e.paid_by as user_id,
            SUM(e.amount) as amount
        FROM app.expenses e
        WHERE e.group_id = p_group_id
          AND e.status = 'approved'
        GROUP BY e.paid_by
    ),
    payment_debts AS (
        -- Paiements effectués (négatif pour celui qui paie)
        SELECT 
            from_user_id as user_id,
            -SUM(amount) as amount
        FROM app.payments
        WHERE group_id = p_group_id
          AND status = 'completed'
        GROUP BY from_user_id
    ),
    payment_credits AS (
        -- Paiements reçus (positif pour celui qui reçoit)
        SELECT 
            to_user_id as user_id,
            SUM(amount) as amount
        FROM app.payments
        WHERE group_id = p_group_id
          AND status = 'completed'
        GROUP BY to_user_id
    ),
    all_balances AS (
        SELECT user_id, amount FROM expense_debts
        UNION ALL
        SELECT user_id, amount FROM expense_credits
        UNION ALL
        SELECT user_id, amount FROM payment_debts
        UNION ALL
        SELECT user_id, amount FROM payment_credits
    )
    SELECT 
        ab.user_id,
        SUM(ab.amount)::DECIMAL(12,2) as balance,
        v_default_currency as currency
    FROM all_balances ab
    GROUP BY ab.user_id
    HAVING SUM(ab.amount) != 0;
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction pour mettre à jour les balances d'un groupe
CREATE OR REPLACE FUNCTION app.update_group_balances(p_group_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Supprimer les anciennes balances
    DELETE FROM app.group_balances WHERE group_id = p_group_id;
    
    -- Insérer les nouvelles balances
    INSERT INTO app.group_balances (group_id, user_id, balance, currency)
    SELECT p_group_id, user_id, balance, currency
    FROM app.calculate_group_balances(p_group_id);
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction pour diviser une dépense équitablement
CREATE OR REPLACE FUNCTION app.split_expense_equally(
    p_expense_id UUID,
    p_participant_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    v_expense RECORD;
    v_split_amount DECIMAL(12,2);
    v_remainder DECIMAL(12,2);
    v_participant_count INTEGER;
    v_index INTEGER := 1;
    v_participant_id UUID;
BEGIN
    -- Récupérer les détails de la dépense
    SELECT * INTO v_expense
    FROM app.expenses
    WHERE id = p_expense_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense not found';
    END IF;
    
    -- Calculer le montant par personne
    v_participant_count := array_length(p_participant_ids, 1);
    v_split_amount := ROUND(v_expense.amount / v_participant_count, 2);
    v_remainder := v_expense.amount - (v_split_amount * v_participant_count);
    
    -- Supprimer les participants existants
    DELETE FROM app.expense_participants WHERE expense_id = p_expense_id;
    
    -- Ajouter les nouveaux participants
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
        INSERT INTO app.expense_participants (expense_id, user_id, amount_owed)
        VALUES (
            p_expense_id, 
            v_participant_id,
            CASE 
                WHEN v_index = 1 THEN v_split_amount + v_remainder
                ELSE v_split_amount
            END
        );
        v_index := v_index + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour obtenir les dettes simplifiées d'un groupe
CREATE OR REPLACE FUNCTION app.get_simplified_debts(p_group_id UUID)
RETURNS TABLE (
    from_user_id UUID,
    to_user_id UUID,
    amount DECIMAL(12,2),
    currency app.currency_type
) AS $$
DECLARE
    v_default_currency app.currency_type;
BEGIN
    -- Récupérer la devise par défaut
    SELECT default_currency INTO v_default_currency
    FROM app.groups WHERE id = p_group_id;
    
    RETURN QUERY
    WITH balances AS (
        SELECT * FROM app.calculate_group_balances(p_group_id)
    ),
    creditors AS (
        SELECT user_id, balance FROM balances WHERE balance > 0 ORDER BY balance DESC
    ),
    debtors AS (
        SELECT user_id, -balance as debt FROM balances WHERE balance < 0 ORDER BY balance ASC
    ),
    simplified AS (
        SELECT 
            d.user_id as from_user_id,
            c.user_id as to_user_id,
            LEAST(d.debt, c.balance) as amount
        FROM debtors d
        CROSS JOIN creditors c
        WHERE d.debt > 0 AND c.balance > 0
    )
    SELECT 
        s.from_user_id,
        s.to_user_id,
        s.amount,
        v_default_currency as currency
    FROM simplified s
    WHERE s.amount > 0.01; -- Ignorer les montants négligeables
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour enregistrer une activité
CREATE OR REPLACE FUNCTION app.log_activity(
    p_user_id UUID,
    p_activity_type app.activity_type,
    p_group_id UUID DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO app.activity_log (
        user_id, 
        activity_type, 
        group_id, 
        entity_type, 
        entity_id, 
        metadata
    )
    VALUES (
        p_user_id, 
        p_activity_type, 
        p_group_id, 
        p_entity_type, 
        p_entity_id, 
        p_metadata
    )
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour obtenir le résumé d'un utilisateur
CREATE OR REPLACE FUNCTION app.get_user_summary(p_user_id UUID)
RETURNS TABLE (
    total_owed_to_you DECIMAL(12,2),
    total_you_owe DECIMAL(12,2),
    active_groups INTEGER,
    pending_expenses INTEGER,
    recent_activity_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN gb.balance > 0 THEN gb.balance ELSE 0 END), 0) as total_owed_to_you,
        COALESCE(SUM(CASE WHEN gb.balance < 0 THEN -gb.balance ELSE 0 END), 0) as total_you_owe,
        COUNT(DISTINCT gm.group_id)::INTEGER as active_groups,
        COUNT(DISTINCT e.id)::INTEGER as pending_expenses,
        COUNT(DISTINCT al.id)::INTEGER as recent_activity_count
    FROM app.group_members gm
    LEFT JOIN app.group_balances gb ON gb.group_id = gm.group_id AND gb.user_id = p_user_id
    LEFT JOIN app.expenses e ON e.group_id = gm.group_id 
        AND e.created_by = p_user_id 
        AND e.status = 'pending'
    LEFT JOIN app.activity_log al ON al.user_id = p_user_id 
        AND al.created_at > NOW() - INTERVAL '7 days'
    WHERE gm.user_id = p_user_id
        AND gm.left_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour valider l'invitation à un groupe
CREATE OR REPLACE FUNCTION app.accept_group_invitation(
    p_invitation_token TEXT,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_invitation RECORD;
    v_member_id UUID;
BEGIN
    -- Vérifier l'invitation
    SELECT * INTO v_invitation
    FROM app.group_invitations
    WHERE token = p_invitation_token
        AND status = 'pending'
        AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Mettre à jour le statut de l'invitation
    UPDATE app.group_invitations
    SET status = 'accepted'
    WHERE id = v_invitation.id;
    
    -- Ajouter le membre au groupe
    INSERT INTO app.group_members (group_id, user_id, invited_by)
    VALUES (v_invitation.group_id, p_user_id, v_invitation.invited_by)
    RETURNING id INTO v_member_id;
    
    -- Logger l'activité
    PERFORM app.log_activity(
        p_user_id,
        'member_joined'::app.activity_type,
        v_invitation.group_id,
        'member',
        v_member_id,
        jsonb_build_object('invited_by', v_invitation.invited_by)
    );
    
    RETURN v_member_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour obtenir les activités récentes d'un utilisateur
CREATE OR REPLACE FUNCTION app.get_recent_activities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    activity_type app.activity_type,
    description TEXT,
    amount DECIMAL(12,2),
    group_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.activity_type,
        CASE 
            WHEN al.activity_type = 'expense_created' THEN 
                'Added expense: ' || COALESCE(e.description, '')
            WHEN al.activity_type = 'payment_made' THEN 
                'Payment to ' || COALESCE(uto.full_name, '')
            WHEN al.activity_type = 'payment_received' THEN 
                'Payment from ' || COALESCE(ufrom.full_name, '')
            ELSE al.activity_type::TEXT
        END as description,
        CASE 
            WHEN al.entity_type = 'expense' THEN e.amount
            WHEN al.entity_type = 'payment' THEN p.amount
            ELSE NULL
        END as amount,
        g.name as group_name,
        al.created_at
    FROM app.activity_log al
    LEFT JOIN app.groups g ON g.id = al.group_id
    LEFT JOIN app.expenses e ON e.id = al.entity_id AND al.entity_type = 'expense'
    LEFT JOIN app.payments p ON p.id = al.entity_id AND al.entity_type = 'payment'
    LEFT JOIN public.user_profiles ufrom ON ufrom.id = p.from_user_id
    LEFT JOIN public.user_profiles uto ON uto.id = p.to_user_id
    WHERE al.user_id = p_user_id
        OR al.group_id IN (
            SELECT group_id FROM app.group_members 
            WHERE user_id = p_user_id AND left_at IS NULL
        )
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction helper pour obtenir l'ID utilisateur actuel
CREATE OR REPLACE FUNCTION app.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Fonction pour calculer les dépenses du mois
CREATE OR REPLACE FUNCTION app.get_monthly_expenses(
    p_user_id UUID,
    p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS DECIMAL(12,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(ep.amount_owed)
         FROM app.expense_participants ep
         JOIN app.expenses e ON e.id = ep.expense_id
         WHERE ep.user_id = p_user_id
           AND e.expense_date >= p_month
           AND e.expense_date < p_month + INTERVAL '1 month'
           AND e.status = 'approved'),
        0
    );
END;
$$ LANGUAGE plpgsql;
