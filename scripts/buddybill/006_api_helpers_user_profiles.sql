-- =====================================================
-- BUDDYBILL - API HELPERS PROFIL UTILISATEUR
-- Script 006: Fonctions RPC pour API et helpers multi-devises
-- =====================================================

-- 1. Fonctions RPC pour la gestion des profils utilisateur
-- ==========================================================

-- 1.1 Fonction pour récupérer le profil complet d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    tenant_id UUID,
    full_name TEXT,
    role TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_language VARCHAR(5),
    preferred_currency VARCHAR(3),
    timezone VARCHAR(50),
    date_format VARCHAR(20),
    currency_display_mode VARCHAR(20),
    theme_preference VARCHAR(10),
    notification_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Si user_id n'est pas fourni, utiliser l'utilisateur connecté
    IF user_id IS NULL THEN
        user_id := auth.uid();
    END IF;

    RETURN QUERY
    SELECT 
        up.id,
        up.tenant_id,
        up.full_name,
        up.role::TEXT,
        up.email,
        up.phone,
        up.avatar_url,
        up.preferred_language,
        up.preferred_currency,
        up.timezone,
        up.date_format,
        up.currency_display_mode,
        up.theme_preference,
        up.notification_preferences,
        up.created_at,
        up.updated_at
    FROM public.user_profiles up
    WHERE up.id = get_user_profile.user_id
    AND (up.id = auth.uid() OR up.tenant_id = public.get_tenant_id() OR public.get_user_role() = 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 Fonction pour mettre à jour les préférences utilisateur
CREATE OR REPLACE FUNCTION public.update_user_preferences(
    preferred_language VARCHAR(5) DEFAULT NULL,
    preferred_currency VARCHAR(3) DEFAULT NULL,
    timezone VARCHAR(50) DEFAULT NULL,
    date_format VARCHAR(20) DEFAULT NULL,
    currency_display_mode VARCHAR(20) DEFAULT NULL,
    theme_preference VARCHAR(10) DEFAULT NULL,
    notification_preferences JSONB DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    updated_profile JSONB
) AS $$
DECLARE
    user_id UUID := auth.uid();
    current_tenant UUID;
    updated_data JSONB;
BEGIN
    -- Vérifier que l'utilisateur est connecté
    IF user_id IS NULL THEN
        RETURN QUERY SELECT false, 'Utilisateur non authentifié'::TEXT, NULL::JSONB;
        RETURN;
    END IF;

    -- Récupérer le tenant_id de l'utilisateur
    SELECT tenant_id INTO current_tenant FROM public.user_profiles WHERE id = user_id;
    
    IF current_tenant IS NULL THEN
        RETURN QUERY SELECT false, 'Profil utilisateur non trouvé'::TEXT, NULL::JSONB;
        RETURN;
    END IF;

    -- Mise à jour conditionnelle des préférences
    UPDATE public.user_profiles 
    SET 
        preferred_language = COALESCE(update_user_preferences.preferred_language, public.user_profiles.preferred_language),
        preferred_currency = COALESCE(update_user_preferences.preferred_currency, public.user_profiles.preferred_currency),
        timezone = COALESCE(update_user_preferences.timezone, public.user_profiles.timezone),
        date_format = COALESCE(update_user_preferences.date_format, public.user_profiles.date_format),
        currency_display_mode = COALESCE(update_user_preferences.currency_display_mode, public.user_profiles.currency_display_mode),
        theme_preference = COALESCE(update_user_preferences.theme_preference, public.user_profiles.theme_preference),
        notification_preferences = COALESCE(update_user_preferences.notification_preferences, public.user_profiles.notification_preferences),
        updated_at = NOW()
    WHERE id = user_id;

    -- Récupérer les données mises à jour
    SELECT row_to_json(up) INTO updated_data
    FROM public.user_profiles up
    WHERE up.id = user_id;

    RETURN QUERY SELECT true, 'Préférences mises à jour avec succès'::TEXT, updated_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonctions RPC pour la gestion des devises
-- ==============================================

-- 2.1 Fonction pour récupérer toutes les devises supportées
CREATE OR REPLACE FUNCTION public.get_supported_currencies()
RETURNS TABLE(
    code VARCHAR(3),
    name TEXT,
    symbol VARCHAR(10),
    decimal_places INTEGER,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.code,
        sc.name,
        sc.symbol,
        sc.decimal_places,
        sc.is_active
    FROM public.supported_currencies sc
    WHERE sc.is_active = true
    ORDER BY sc.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Fonction pour convertir un montant entre devises
CREATE OR REPLACE FUNCTION public.convert_amount(
    amount DECIMAL(15,2),
    from_currency VARCHAR(3),
    to_currency VARCHAR(3)
)
RETURNS TABLE(
    original_amount DECIMAL(15,2),
    original_currency VARCHAR(3),
    converted_amount DECIMAL(15,2),
    target_currency VARCHAR(3),
    exchange_rate DECIMAL(15,8),
    conversion_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    rate DECIMAL(15,8);
    converted DECIMAL(15,2);
BEGIN
    -- Récupérer le taux de change
    rate := public.get_exchange_rate(from_currency, to_currency);
    
    -- Convertir le montant
    converted := public.convert_currency(amount, from_currency, to_currency);

    RETURN QUERY 
    SELECT 
        amount,
        from_currency,
        converted,
        to_currency,
        rate,
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3 Fonction pour obtenir les taux de change récents
CREATE OR REPLACE FUNCTION public.get_recent_exchange_rates(
    p_base_currency VARCHAR(3) DEFAULT 'CAD',
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    base_currency VARCHAR(3),
    target_currency VARCHAR(3),
    rate DECIMAL(15,8),
    rate_date DATE,
    source VARCHAR(50),
    is_cached BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_rates AS (
        -- Récupérer les taux récents de la table principale
        SELECT DISTINCT ON (cr.target_currency)
            cr.base_currency,
            cr.target_currency,
            cr.rate,
            cr.date as rate_date,
            cr.source,
            false as is_cached
        FROM public.currency_rates cr
        WHERE cr.base_currency = p_base_currency
        ORDER BY cr.target_currency, cr.date DESC
    ),
    cached_rates AS (
        -- Récupérer les taux du cache
        SELECT 
            cc.base_currency,
            cc.target_currency,
            cc.rate,
            DATE(cc.cached_at) as rate_date,
            cc.api_source as source,
            true as is_cached
        FROM public.currency_cache cc
        WHERE cc.base_currency = p_base_currency
        AND cc.expires_at > NOW()
    ),
    combined_rates AS (
        SELECT * FROM recent_rates
        UNION ALL
        SELECT * FROM cached_rates
    )
    SELECT * FROM combined_rates
    ORDER BY combined_rates.target_currency
    LIMIT get_recent_exchange_rates.limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonctions RPC pour la gestion des abonnements
-- ==================================================

-- 3.1 Fonction pour récupérer les détails d'abonnement du tenant
CREATE OR REPLACE FUNCTION public.get_tenant_subscription()
RETURNS TABLE(
    subscription_id UUID,
    tenant_id UUID,
    tenant_name TEXT,
    plan_name TEXT,
    plan_description TEXT,
    status TEXT,
    start_date DATE,
    end_date DATE,
    days_until_expiry INTEGER,
    auto_renew BOOLEAN,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB
) AS $$
DECLARE
    current_tenant UUID := public.get_tenant_id();
BEGIN
    IF current_tenant IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        sd.id,
        sd.tenant_id,
        sd.tenant_name,
        sd.plan_name,
        sd.plan_description,
        sd.status,
        sd.start_date,
        sd.end_date,
        sd.days_until_expiry,
        sd.auto_renew,
        sd.price_monthly,
        sd.price_yearly,
        sd.features
    FROM public.subscription_details sd
    WHERE sd.tenant_id = current_tenant
    AND sd.status = 'active'
    ORDER BY sd.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Fonction pour récupérer tous les plans disponibles
CREATE OR REPLACE FUNCTION public.get_available_subscription_plans()
RETURNS TABLE(
    plan_id UUID,
    name VARCHAR(50),
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    max_users INTEGER,
    max_invoices_per_month INTEGER,
    features JSONB,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.description,
        sp.price_monthly,
        sp.price_yearly,
        sp.max_users,
        sp.max_invoices_per_month,
        sp.features,
        sp.is_active
    FROM public.subscription_plans sp
    WHERE sp.is_active = true
    ORDER BY sp.price_monthly ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonctions d'aide pour les API externes
-- ===========================================

-- 4.1 Fonction pour mettre à jour les taux de change (API externe)
CREATE OR REPLACE FUNCTION public.update_exchange_rates(
    rates_data JSONB,
    api_source VARCHAR(100) DEFAULT 'external_api'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    updated_count INTEGER
) AS $$
DECLARE
    rate_record RECORD;
    update_count INTEGER := 0;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Vérifier les permissions (seuls les admins peuvent mettre à jour)
    IF public.get_user_role() NOT IN ('superadmin', 'tenant_admin') THEN
        RETURN QUERY SELECT false, 'Permissions insuffisantes'::TEXT, 0;
        RETURN;
    END IF;

    -- Parcourir les données de taux fournies
    FOR rate_record IN 
        SELECT * FROM jsonb_to_recordset(rates_data) AS x(
            base_currency VARCHAR(3),
            target_currency VARCHAR(3),
            rate DECIMAL(15,8)
        )
    LOOP
        -- Insérer ou mettre à jour le taux de change
        INSERT INTO public.currency_rates (
            base_currency, target_currency, rate, date, source
        ) VALUES (
            rate_record.base_currency,
            rate_record.target_currency,
            rate_record.rate,
            current_date,
            api_source
        )
        ON CONFLICT (base_currency, target_currency, date)
        DO UPDATE SET
            rate = EXCLUDED.rate,
            source = EXCLUDED.source;

        -- Mettre à jour le cache
        INSERT INTO public.currency_cache (
            base_currency, target_currency, rate, api_source
        ) VALUES (
            rate_record.base_currency,
            rate_record.target_currency,
            rate_record.rate,
            api_source
        )
        ON CONFLICT (base_currency, target_currency)
        DO UPDATE SET
            rate = EXCLUDED.rate,
            cached_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours',
            api_source = EXCLUDED.api_source;

        update_count := update_count + 1;
    END LOOP;

    RETURN QUERY SELECT true, format('Taux de change mis à jour avec succès', update_count)::TEXT, update_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonctions pour les notifications et rappels
-- ================================================

-- 5.1 Fonction pour récupérer les notifications en attente
CREATE OR REPLACE FUNCTION public.get_pending_renewal_notifications()
RETURNS TABLE(
    notification_id UUID,
    tenant_id UUID,
    tenant_name TEXT,
    subscription_id UUID,
    notification_type TEXT,
    days_until_expiry INTEGER,
    email_sent BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_tenant UUID := public.get_tenant_id();
BEGIN
    -- Si superadmin, voir toutes les notifications
    IF public.get_user_role() = 'superadmin' THEN
        current_tenant := NULL;
    END IF;

    RETURN QUERY
    SELECT 
        rn.id,
        rn.tenant_id,
        t.name as tenant_name,
        rn.subscription_id,
        rn.notification_type,
        (ts.end_date - CURRENT_DATE) as days_until_expiry,
        rn.email_sent,
        rn.created_at
    FROM public.renewal_notifications rn
    JOIN public.tenants t ON rn.tenant_id = t.id
    JOIN public.tenant_subscriptions ts ON rn.subscription_id = ts.id
    WHERE (current_tenant IS NULL OR rn.tenant_id = current_tenant)
    AND rn.email_sent = false
    ORDER BY rn.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Fonction pour marquer une notification comme envoyée
CREATE OR REPLACE FUNCTION public.mark_notification_sent(
    notification_id UUID,
    email_sent BOOLEAN DEFAULT true,
    sms_sent BOOLEAN DEFAULT false
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    UPDATE public.renewal_notifications
    SET 
        email_sent = mark_notification_sent.email_sent,
        sms_sent = mark_notification_sent.sms_sent
    WHERE id = notification_id
    AND (tenant_id = public.get_tenant_id() OR public.get_user_role() = 'superadmin');

    IF FOUND THEN
        RETURN QUERY SELECT true, 'Notification mise à jour avec succès'::TEXT;
    ELSE
        RETURN QUERY SELECT false, 'Notification non trouvée ou permissions insuffisantes'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonctions pour le système SmartCurrency
-- ============================================

-- 6.1 Fonction pour formater un montant selon les préférences utilisateur
CREATE OR REPLACE FUNCTION public.format_currency_for_user(
    amount DECIMAL(15,2),
    original_currency VARCHAR(3),
    user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    formatted_amount TEXT,
    display_currency VARCHAR(3),
    converted_amount DECIMAL(15,2),
    exchange_rate DECIMAL(15,8),
    display_mode TEXT
) AS $$
DECLARE
    user_currency VARCHAR(3);
    user_display_mode VARCHAR(20);
    target_user_id UUID;
    converted DECIMAL(15,2);
    rate DECIMAL(15,8);
    currency_symbol VARCHAR(10);
BEGIN
    -- Utiliser l'utilisateur connecté si non spécifié
    target_user_id := COALESCE(user_id, auth.uid());

    -- Récupérer les préférences de l'utilisateur
    SELECT preferred_currency, currency_display_mode 
    INTO user_currency, user_display_mode
    FROM public.user_profiles 
    WHERE id = target_user_id;

    -- Valeurs par défaut si utilisateur non trouvé
    user_currency := COALESCE(user_currency, 'CAD');
    user_display_mode := COALESCE(user_display_mode, 'dual');

    -- Récupérer le symbole de la devise
    SELECT symbol INTO currency_symbol
    FROM public.supported_currencies
    WHERE code = user_currency;

    -- Convertir si nécessaire
    IF original_currency = user_currency THEN
        converted := amount;
        rate := 1.0;
    ELSE
        converted := public.convert_currency(amount, original_currency, user_currency);
        rate := public.get_exchange_rate(original_currency, user_currency);
    END IF;

    RETURN QUERY
    SELECT 
        CASE 
            WHEN user_display_mode = 'dual' AND original_currency != user_currency THEN
                format('%s%s %s (~%s%s %s)', 
                    (SELECT symbol FROM public.supported_currencies WHERE code = original_currency),
                    amount::TEXT, 
                    original_currency,
                    currency_symbol,
                    converted::TEXT,
                    user_currency
                )
            ELSE
                format('%s%s %s', currency_symbol, converted::TEXT, user_currency)
        END,
        user_currency,
        converted,
        rate,
        user_display_mode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonctions de maintenance et nettoyage
-- ==========================================

-- 7.1 Fonction pour nettoyer le cache des devises expiré
CREATE OR REPLACE FUNCTION public.cleanup_expired_currency_cache()
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    cleaned_count INTEGER
) AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.currency_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        true, 
        format('Cache nettoyé : %s entrées supprimées', deleted_count)::TEXT,
        deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 Fonction pour traiter les abonnements expirés
CREATE OR REPLACE FUNCTION public.process_expired_subscriptions()
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    processed_count INTEGER
) AS $$
DECLARE
    updated_count INTEGER := 0;
    subscription_record RECORD;
BEGIN
    -- Marquer les abonnements expirés
    FOR subscription_record IN
        SELECT id, tenant_id FROM public.tenant_subscriptions
        WHERE status = 'active' 
        AND end_date < CURRENT_DATE
    LOOP
        UPDATE public.tenant_subscriptions
        SET status = 'expired', updated_at = NOW()
        WHERE id = subscription_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;

    RETURN QUERY SELECT 
        true,
        format('Abonnements traités : %s expirés', updated_count)::TEXT,
        updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Messages de confirmation
DO $$
BEGIN
    RAISE NOTICE '🔧 Fonctions API pour profils utilisateur créées !';
    RAISE NOTICE '👤 Fonctions RPC : get_user_profile, update_user_preferences';
    RAISE NOTICE '💱 Fonctions devises : get_supported_currencies, convert_amount, get_recent_exchange_rates';
    RAISE NOTICE '📅 Fonctions abonnements : get_tenant_subscription, get_available_subscription_plans';
    RAISE NOTICE '🔔 Fonctions notifications : get_pending_renewal_notifications, mark_notification_sent';
    RAISE NOTICE '💰 Fonction SmartCurrency : format_currency_for_user';
    RAISE NOTICE '🧹 Fonctions maintenance : cleanup_expired_currency_cache, process_expired_subscriptions';
    RAISE NOTICE '🚀 Toutes les fonctions API sont prêtes pour intégration frontend !';
END $$;
