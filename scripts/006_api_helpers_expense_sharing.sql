-- =====================================================
-- EXPENSE SHARING APP - FONCTIONS API HELPERS
-- Script 006: Fonctions pour simplifier les appels API
-- =====================================================

-- 1. Fonction pour créer un groupe avec membres initiaux
CREATE OR REPLACE FUNCTION app.create_group_with_members(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_default_currency app.currency_type DEFAULT 'USD',
    p_is_invite_only BOOLEAN DEFAULT true,
    p_require_approval BOOLEAN DEFAULT false,
    p_member_emails TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
    v_creator_id UUID;
    v_email TEXT;
BEGIN
    -- Récupérer l'ID du créateur
    v_creator_id := auth.uid();
    
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Créer le groupe
    INSERT INTO app.groups (
        name, 
        description, 
        type, 
        image_url, 
        default_currency, 
        is_invite_only, 
        require_approval, 
        created_by
    )
    VALUES (
        p_name, 
        p_description, 
        p_type, 
        p_image_url, 
        p_default_currency, 
        p_is_invite_only, 
        p_require_approval, 
        v_creator_id
    )
    RETURNING id INTO v_group_id;
    
    -- Créer des invitations pour les membres
    FOREACH v_email IN ARRAY p_member_emails
    LOOP
        INSERT INTO app.group_invitations (group_id, email, invited_by)
        VALUES (v_group_id, v_email, v_creator_id);
    END LOOP;
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour créer une dépense avec split automatique
CREATE OR REPLACE FUNCTION app.create_expense_with_split(
    p_group_id UUID,
    p_description TEXT,
    p_amount DECIMAL(12,2),
    p_currency app.currency_type,
    p_category_id UUID DEFAULT NULL,
    p_expense_date DATE DEFAULT CURRENT_DATE,
    p_receipt_url TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_split_type app.expense_split_type DEFAULT 'equal',
    p_participant_data JSONB DEFAULT NULL -- [{"user_id": "uuid", "amount": 100, "percentage": 50, "shares": 2}]
)
RETURNS UUID AS $$
DECLARE
    v_expense_id UUID;
    v_paid_by UUID;
    v_participant JSONB;
    v_total_amount DECIMAL(12,2) := 0;
BEGIN
    -- Récupérer l'ID du payeur (utilisateur actuel)
    v_paid_by := auth.uid();
    
    -- Créer la dépense
    INSERT INTO app.expenses (
        group_id,
        description,
        amount,
        currency,
        category_id,
        paid_by,
        expense_date,
        receipt_url,
        notes,
        split_type,
        created_by
    )
    VALUES (
        p_group_id,
        p_description,
        p_amount,
        p_currency,
        p_category_id,
        v_paid_by,
        p_expense_date,
        p_receipt_url,
        p_notes,
        p_split_type,
        v_paid_by
    )
    RETURNING id INTO v_expense_id;
    
    -- Gérer le split selon le type
    IF p_split_type = 'equal' THEN
        -- Si pas de données de participants, diviser entre tous les membres actifs
        IF p_participant_data IS NULL THEN
            PERFORM app.split_expense_equally(
                v_expense_id,
                ARRAY(
                    SELECT user_id 
                    FROM app.group_members 
                    WHERE group_id = p_group_id 
                      AND left_at IS NULL
                )
            );
        ELSE
            -- Diviser entre les participants spécifiés
            PERFORM app.split_expense_equally(
                v_expense_id,
                ARRAY(
                    SELECT (value->>'user_id')::UUID
                    FROM jsonb_array_elements(p_participant_data)
                )
            );
        END IF;
    ELSE
        -- Pour les autres types de split, utiliser les données fournies
        FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participant_data)
        LOOP
            INSERT INTO app.expense_participants (
                expense_id,
                user_id,
                amount_owed,
                percentage,
                shares
            )
            VALUES (
                v_expense_id,
                (v_participant->>'user_id')::UUID,
                COALESCE((v_participant->>'amount')::DECIMAL, 0),
                (v_participant->>'percentage')::DECIMAL,
                (v_participant->>'shares')::INTEGER
            );
            
            v_total_amount := v_total_amount + COALESCE((v_participant->>'amount')::DECIMAL, 0);
        END LOOP;
        
        -- Vérifier que le total correspond au montant de la dépense
        IF ABS(v_total_amount - p_amount) > 0.01 THEN
            RAISE EXCEPTION 'Split amounts do not match expense amount';
        END IF;
    END IF;
    
    RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour enregistrer un paiement et marquer comme réglé
CREATE OR REPLACE FUNCTION app.record_payment(
    p_group_id UUID,
    p_to_user_id UUID,
    p_amount DECIMAL(12,2),
    p_currency app.currency_type DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_auto_confirm BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_from_user_id UUID;
    v_group_currency app.currency_type;
BEGIN
    -- Récupérer l'ID du payeur
    v_from_user_id := auth.uid();
    
    -- Récupérer la devise du groupe si non spécifiée
    IF p_currency IS NULL THEN
        SELECT default_currency INTO v_group_currency
        FROM app.groups
        WHERE id = p_group_id;
        
        p_currency := v_group_currency;
    END IF;
    
    -- Créer le paiement
    INSERT INTO app.payments (
        group_id,
        from_user_id,
        to_user_id,
        amount,
        currency,
        payment_method,
        reference_number,
        notes,
        status
    )
    VALUES (
        p_group_id,
        v_from_user_id,
        p_to_user_id,
        p_amount,
        p_currency,
        p_payment_method,
        p_reference_number,
        p_notes,
        CASE WHEN p_auto_confirm THEN 'completed' ELSE 'pending' END
    )
    RETURNING id INTO v_payment_id;
    
    -- Si auto-confirmé, mettre à jour la date de confirmation
    IF p_auto_confirm THEN
        UPDATE app.payments
        SET confirmed_at = NOW()
        WHERE id = v_payment_id;
    END IF;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour obtenir les groupes d'un utilisateur avec détails
CREATE OR REPLACE FUNCTION app.get_user_groups_detailed(
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    group_id UUID,
    name TEXT,
    description TEXT,
    type TEXT,
    image_url TEXT,
    default_currency app.currency_type,
    role app.group_member_role,
    member_count BIGINT,
    expense_count BIGINT,
    balance DECIMAL(12,2),
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    p_user_id := COALESCE(p_user_id, auth.uid());
    
    RETURN QUERY
    SELECT 
        g.id as group_id,
        g.name,
        g.description,
        g.type,
        g.image_url,
        g.default_currency,
        gm.role,
        gs.member_count,
        gs.expense_count,
        COALESCE(gb.balance, 0) as balance,
        gs.last_activity
    FROM app.groups g
    JOIN app.group_members gm ON gm.group_id = g.id
    LEFT JOIN app.groups_with_stats gs ON gs.id = g.id
    LEFT JOIN app.group_balances gb ON gb.group_id = g.id AND gb.user_id = p_user_id
    WHERE gm.user_id = p_user_id
      AND gm.left_at IS NULL
      AND g.archived_at IS NULL
    ORDER BY gs.last_activity DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour obtenir les dépenses d'un groupe avec filtres
CREATE OR REPLACE FUNCTION app.get_group_expenses(
    p_group_id UUID,
    p_status app.expense_status DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_from_date DATE DEFAULT NULL,
    p_to_date DATE DEFAULT NULL,
    p_paid_by UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    expense JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT row_to_json(e.*)::JSONB as expense
    FROM app.expenses_detailed e
    WHERE e.group_id = p_group_id
      AND (p_status IS NULL OR e.status = p_status)
      AND (p_category_id IS NULL OR e.category_id = p_category_id)
      AND (p_from_date IS NULL OR e.expense_date >= p_from_date)
      AND (p_to_date IS NULL OR e.expense_date <= p_to_date)
      AND (p_paid_by IS NULL OR e.paid_by = p_paid_by)
    ORDER BY e.expense_date DESC, e.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 6. Fonction pour régler toutes les dettes entre deux utilisateurs
CREATE OR REPLACE FUNCTION app.settle_all_debts(
    p_group_id UUID,
    p_with_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_current_user_id UUID;
    v_balance DECIMAL(12,2);
    v_from_user UUID;
    v_to_user UUID;
    v_amount DECIMAL(12,2);
BEGIN
    v_current_user_id := auth.uid();
    
    -- Calculer la balance nette entre les deux utilisateurs
    WITH user_balances AS (
        SELECT * FROM app.calculate_group_balances(p_group_id)
    )
    SELECT 
        ub1.balance - COALESCE(ub2.balance, 0) INTO v_balance
    FROM user_balances ub1
    LEFT JOIN user_balances ub2 ON ub2.user_id = p_with_user_id
    WHERE ub1.user_id = v_current_user_id;
    
    -- Déterminer qui paie qui
    IF v_balance > 0 THEN
        -- L'autre utilisateur doit à l'utilisateur actuel
        v_from_user := p_with_user_id;
        v_to_user := v_current_user_id;
        v_amount := v_balance;
    ELSIF v_balance < 0 THEN
        -- L'utilisateur actuel doit à l'autre
        v_from_user := v_current_user_id;
        v_to_user := p_with_user_id;
        v_amount := -v_balance;
    ELSE
        -- Déjà réglé
        RETURN;
    END IF;
    
    -- Créer un paiement automatique
    INSERT INTO app.payments (
        group_id,
        from_user_id,
        to_user_id,
        amount,
        currency,
        payment_method,
        notes,
        status,
        confirmed_at
    )
    VALUES (
        p_group_id,
        v_from_user,
        v_to_user,
        v_amount,
        (SELECT default_currency FROM app.groups WHERE id = p_group_id),
        'settlement',
        'Automatic settlement',
        'completed',
        NOW()
    );
    
    -- Marquer toutes les dépenses concernées comme réglées
    UPDATE app.expense_participants ep
    SET is_settled = true,
        settled_at = NOW()
    WHERE expense_id IN (
        SELECT e.id
        FROM app.expenses e
        WHERE e.group_id = p_group_id
          AND (
            (e.paid_by = v_current_user_id AND ep.user_id = p_with_user_id)
            OR
            (e.paid_by = p_with_user_id AND ep.user_id = v_current_user_id)
          )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Permissions
GRANT EXECUTE ON FUNCTION app.create_group_with_members TO authenticated;
GRANT EXECUTE ON FUNCTION app.create_expense_with_split TO authenticated;
GRANT EXECUTE ON FUNCTION app.record_payment TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_user_groups_detailed TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_group_expenses TO authenticated;
GRANT EXECUTE ON FUNCTION app.settle_all_debts TO authenticated;
