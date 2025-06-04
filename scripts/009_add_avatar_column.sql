-- =====================================================
-- EXPENSE SHARING APP - AJOUTER COLONNE AVATAR
-- Script 009: Vérifie et ajoute la colonne avatar_url
-- =====================================================

-- Vérifier si la colonne avatar_url existe déjà dans user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'user_profiles' 
          AND column_name = 'avatar_url'
    ) THEN
        -- Ajouter la colonne si elle n'existe pas
        ALTER TABLE public.user_profiles 
        ADD COLUMN avatar_url TEXT;
        
        RAISE NOTICE 'Colonne avatar_url ajoutée à la table user_profiles';
    ELSE
        RAISE NOTICE 'Colonne avatar_url existe déjà dans user_profiles';
    END IF;
END $$;

-- Maintenant, on peut recréer les vues avec avatar_url

-- Vue des dépenses détaillées
CREATE OR REPLACE VIEW app.expenses_detailed AS
SELECT 
    e.*,
    up.full_name as paid_by_name,
    COALESCE(up.avatar_url, NULL) as paid_by_avatar,
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
                'user_avatar', COALESCE(u.avatar_url, NULL),
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

-- Vue des balances détaillées
CREATE OR REPLACE VIEW app.balances_detailed AS
SELECT 
    gb.*,
    u.full_name as user_name,
    COALESCE(u.avatar_url, NULL) as user_avatar,
    g.name as group_name,
    CASE 
        WHEN gb.balance > 0 THEN 'creditor'
        WHEN gb.balance < 0 THEN 'debtor'
        ELSE 'settled'
    END as balance_type
FROM app.group_balances gb
JOIN public.user_profiles u ON u.id = gb.user_id
JOIN app.groups g ON g.id = gb.group_id;

-- Vue des paiements détaillés
CREATE OR REPLACE VIEW app.payments_detailed AS
SELECT 
    p.*,
    uf.full_name as from_user_name,
    COALESCE(uf.avatar_url, NULL) as from_user_avatar,
    ut.full_name as to_user_name,
    COALESCE(ut.avatar_url, NULL) as to_user_avatar,
    g.name as group_name
FROM app.payments p
JOIN public.user_profiles uf ON uf.id = p.from_user_id
JOIN public.user_profiles ut ON ut.id = p.to_user_id
JOIN app.groups g ON g.id = p.group_id;

-- Vue du tableau de bord utilisateur
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
    COALESCE(u.avatar_url, NULL) as avatar_url,
    COALESCE(ug.active_groups, 0) as active_groups,
    COALESCE(ub.total_owed_to_you, 0) as total_owed_to_you,
    COALESCE(ub.total_you_owe, 0) as total_you_owe,
    COALESCE(ue.pending_expenses, 0) as pending_expenses,
    COALESCE(ue.month_expenses, 0) as month_expenses
FROM public.user_profiles u
LEFT JOIN user_groups ug ON ug.user_id = u.id
LEFT JOIN user_balances ub ON ub.user_id = u.id
LEFT JOIN user_expenses ue ON ue.user_id = u.id;

-- Fonction pour obtenir les membres d'un groupe avec balances
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
        COALESCE(u.avatar_url, NULL)::TEXT,
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

-- Vérification finale
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Vérifier que la colonne existe maintenant
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'avatar_url';
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Succès: La colonne avatar_url existe dans user_profiles';
    ELSE
        RAISE EXCEPTION 'Erreur: La colonne avatar_url n''a pas pu être créée';
    END IF;
END $$;
