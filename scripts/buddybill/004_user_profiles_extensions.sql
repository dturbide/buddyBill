-- =====================================================
-- BUDDYBILL - EXTENSIONS PROFIL UTILISATEUR
-- Script 004: Page profil, préférences et système multi-devises
-- =====================================================

-- 1. Extension de la table user_profiles avec nouvelles colonnes
-- ================================================================

-- Ajout des colonnes de préférences utilisateur
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'CAD',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Toronto',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
ADD COLUMN IF NOT EXISTS currency_display_mode VARCHAR(20) DEFAULT 'dual',
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'light',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sms": false,
    "renewal_reminders": true,
    "payment_confirmations": true,
    "balance_alerts": true
}'::jsonb;

-- 2. Tables du système multi-devises
-- ===================================

-- 2.1 Liste des devises supportées
CREATE TABLE IF NOT EXISTS public.supported_currencies (
    code VARCHAR(3) PRIMARY KEY,
    name TEXT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des devises principales
INSERT INTO public.supported_currencies (code, name, symbol, decimal_places, is_active) VALUES
('CAD', 'Dollar Canadien', '$', 2, true),
('USD', 'Dollar Américain', '$', 2, true),
('EUR', 'Euro', '€', 2, true),
('GBP', 'Livre Sterling', '£', 2, true),
('JPY', 'Yen Japonais', '¥', 0, true),
('CHF', 'Franc Suisse', 'CHF', 2, true),
('AUD', 'Dollar Australien', 'A$', 2, true),
('CNY', 'Yuan Chinois', '¥', 2, true),
('INR', 'Roupie Indienne', '₹', 2, true),
('BRL', 'Real Brésilien', 'R$', 2, true),
('MXN', 'Peso Mexicain', '$', 2, true),
('KRW', 'Won Sud-Coréen', '₩', 0, true)
ON CONFLICT (code) DO NOTHING;

-- 2.2 Taux de change
CREATE TABLE IF NOT EXISTS public.currency_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL REFERENCES public.supported_currencies(code),
    target_currency VARCHAR(3) NOT NULL REFERENCES public.supported_currencies(code),
    rate DECIMAL(15,8) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(50) DEFAULT 'api', -- 'api', 'manual', 'cached'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, date)
);

-- 2.3 Cache des taux de change (pour optimisation)
CREATE TABLE IF NOT EXISTS public.currency_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    api_source VARCHAR(100),
    UNIQUE(base_currency, target_currency)
);

-- 3. Tables du système d'abonnements
-- ===================================

-- 3.1 Plans d'abonnement
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    max_users INTEGER,
    max_invoices_per_month INTEGER,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des plans de base
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_users, max_invoices_per_month, features) VALUES
('basic', 'Plan de base pour petites entreprises', 29.99, 299.99, 5, 50, '["basic_invoicing", "expense_tracking", "basic_reports"]'::jsonb),
('professional', 'Plan professionnel pour entreprises moyennes', 59.99, 599.99, 15, 200, '["advanced_invoicing", "expense_tracking", "advanced_reports", "multi_currency", "api_access"]'::jsonb),
('enterprise', 'Plan entreprise pour grandes organisations', 99.99, 999.99, -1, -1, '["unlimited_invoicing", "expense_tracking", "custom_reports", "multi_currency", "api_access", "priority_support", "custom_integrations"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 3.2 Abonnements des tenants
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    payment_method VARCHAR(50),
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 Historique des renouvellements
CREATE TABLE IF NOT EXISTS public.subscription_renewals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
    old_end_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    payment_status VARCHAR(20) DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    renewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 Notifications de renouvellement
CREATE TABLE IF NOT EXISTS public.renewal_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('7_days', '3_days', '1_day', 'expired')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fonctions utilitaires
-- =========================

-- 4.1 Fonction de conversion de devise
CREATE OR REPLACE FUNCTION public.convert_currency(
    amount DECIMAL(15,2),
    from_currency VARCHAR(3),
    to_currency VARCHAR(3),
    use_cache BOOLEAN DEFAULT true
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    exchange_rate DECIMAL(15,8);
    converted_amount DECIMAL(15,2);
BEGIN
    -- Si même devise, retourner le montant original
    IF from_currency = to_currency THEN
        RETURN amount;
    END IF;

    -- Essayer d'abord le cache si demandé
    IF use_cache THEN
        SELECT rate INTO exchange_rate
        FROM public.currency_cache
        WHERE base_currency = from_currency 
        AND target_currency = to_currency
        AND expires_at > NOW();
    END IF;

    -- Si pas trouvé dans le cache, chercher dans les taux historiques
    IF exchange_rate IS NULL THEN
        SELECT rate INTO exchange_rate
        FROM public.currency_rates
        WHERE base_currency = from_currency 
        AND target_currency = to_currency
        ORDER BY date DESC
        LIMIT 1;
    END IF;

    -- Si toujours pas trouvé, essayer la conversion inverse
    IF exchange_rate IS NULL THEN
        SELECT (1.0 / rate) INTO exchange_rate
        FROM public.currency_rates
        WHERE base_currency = to_currency 
        AND target_currency = from_currency
        ORDER BY date DESC
        LIMIT 1;
    END IF;

    -- Si aucun taux trouvé, retourner le montant original
    IF exchange_rate IS NULL THEN
        RETURN amount;
    END IF;

    -- Calculer et retourner le montant converti
    converted_amount := amount * exchange_rate;
    RETURN ROUND(converted_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- 4.2 Fonction pour obtenir le taux de change
CREATE OR REPLACE FUNCTION public.get_exchange_rate(
    from_currency VARCHAR(3),
    to_currency VARCHAR(3)
)
RETURNS DECIMAL(15,8) AS $$
DECLARE
    exchange_rate DECIMAL(15,8);
BEGIN
    -- Si même devise, taux = 1
    IF from_currency = to_currency THEN
        RETURN 1.0;
    END IF;

    -- Chercher dans le cache en premier
    SELECT rate INTO exchange_rate
    FROM public.currency_cache
    WHERE base_currency = from_currency 
    AND target_currency = to_currency
    AND expires_at > NOW();

    IF exchange_rate IS NOT NULL THEN
        RETURN exchange_rate;
    END IF;

    -- Chercher dans les taux historiques
    SELECT rate INTO exchange_rate
    FROM public.currency_rates
    WHERE base_currency = from_currency 
    AND target_currency = to_currency
    ORDER BY date DESC
    LIMIT 1;

    IF exchange_rate IS NOT NULL THEN
        RETURN exchange_rate;
    END IF;

    -- Essayer la conversion inverse
    SELECT (1.0 / rate) INTO exchange_rate
    FROM public.currency_rates
    WHERE base_currency = to_currency 
    AND target_currency = from_currency
    ORDER BY date DESC
    LIMIT 1;

    RETURN COALESCE(exchange_rate, 1.0);
END;
$$ LANGUAGE plpgsql;

-- 4.3 Fonction pour calculer la date de fin d'abonnement
CREATE OR REPLACE FUNCTION public.calculate_subscription_end_date(
    start_date DATE,
    billing_cycle VARCHAR(10) -- 'monthly' ou 'yearly'
)
RETURNS DATE AS $$
BEGIN
    IF billing_cycle = 'yearly' THEN
        RETURN start_date + INTERVAL '1 year';
    ELSE
        RETURN start_date + INTERVAL '1 month';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4.4 Fonction pour envoyer les rappels de renouvellement
CREATE OR REPLACE FUNCTION public.send_renewal_reminders()
RETURNS VOID AS $$
DECLARE
    subscription_record RECORD;
    days_until_expiry INTEGER;
    notification_type VARCHAR(20);
BEGIN
    -- Parcourir tous les abonnements actifs
    FOR subscription_record IN
        SELECT ts.*, t.name as tenant_name, sp.name as plan_name
        FROM public.tenant_subscriptions ts
        JOIN public.tenants t ON ts.tenant_id = t.id
        JOIN public.subscription_plans sp ON ts.plan_id = sp.id
        WHERE ts.status = 'active'
        AND ts.auto_renew = true
    LOOP
        -- Calculer les jours jusqu'à expiration
        days_until_expiry := subscription_record.end_date - CURRENT_DATE;
        
        -- Déterminer le type de notification
        notification_type := CASE
            WHEN days_until_expiry = 7 THEN '7_days'
            WHEN days_until_expiry = 3 THEN '3_days'
            WHEN days_until_expiry = 1 THEN '1_day'
            WHEN days_until_expiry = 0 THEN 'expired'
            ELSE NULL
        END;

        -- Envoyer la notification si applicable
        IF notification_type IS NOT NULL THEN
            -- Vérifier si la notification n'a pas déjà été envoyée
            IF NOT EXISTS (
                SELECT 1 FROM public.renewal_notifications
                WHERE tenant_id = subscription_record.tenant_id
                AND subscription_id = subscription_record.id
                AND notification_type = notification_type
                AND DATE(created_at) = CURRENT_DATE
            ) THEN
                -- Insérer la notification
                INSERT INTO public.renewal_notifications (
                    tenant_id, subscription_id, notification_type
                ) VALUES (
                    subscription_record.tenant_id,
                    subscription_record.id,
                    notification_type
                );
                
                -- Ici, on pourrait ajouter la logique d'envoi d'email/SMS
                -- Pour l'instant, on se contente d'enregistrer la notification
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers
-- ============

-- 5.1 Trigger pour mise à jour automatique des user_profiles
CREATE OR REPLACE FUNCTION public.update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_user_profile_updated_at();

-- 5.2 Trigger pour les abonnements
CREATE TRIGGER update_tenant_subscriptions_updated_at 
    BEFORE UPDATE ON public.tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Index pour optimisation
-- ===========================

-- Index pour les profils utilisateur
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_currency ON public.user_profiles(preferred_currency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferred_language ON public.user_profiles(preferred_language);

-- Index pour les taux de change
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON public.currency_rates(date DESC);
CREATE INDEX IF NOT EXISTS idx_currency_rates_currencies ON public.currency_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_currency_cache_expires ON public.currency_cache(expires_at);

-- Index pour les abonnements
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_end_date ON public.tenant_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_renewal_notifications_tenant_id ON public.renewal_notifications(tenant_id);

-- 7. Vues utilitaires
-- ====================

-- 7.1 Vue des abonnements avec détails
CREATE OR REPLACE VIEW public.subscription_details AS
SELECT 
    ts.id,
    ts.tenant_id,
    t.name as tenant_name,
    sp.name as plan_name,
    sp.description as plan_description,
    ts.status,
    ts.start_date,
    ts.end_date,
    (ts.end_date - CURRENT_DATE) as days_until_expiry,
    ts.auto_renew,
    sp.price_monthly,
    sp.price_yearly,
    sp.features,
    ts.created_at,
    ts.updated_at
FROM public.tenant_subscriptions ts
JOIN public.tenants t ON ts.tenant_id = t.id
JOIN public.subscription_plans sp ON ts.plan_id = sp.id;

-- 7.2 Vue des taux de change récents
CREATE OR REPLACE VIEW public.latest_exchange_rates AS
SELECT DISTINCT ON (base_currency, target_currency)
    base_currency,
    target_currency,
    rate,
    date,
    source
FROM public.currency_rates
ORDER BY base_currency, target_currency, date DESC;

-- 8. Données de test pour le développement
-- ==========================================

-- Insérer quelques taux de change de base (CAD vers autres devises)
INSERT INTO public.currency_rates (base_currency, target_currency, rate, date, source) VALUES
('CAD', 'USD', 0.74, CURRENT_DATE, 'manual'),
('CAD', 'EUR', 0.68, CURRENT_DATE, 'manual'),
('CAD', 'GBP', 0.58, CURRENT_DATE, 'manual'),
('CAD', 'JPY', 110.50, CURRENT_DATE, 'manual'),
('USD', 'CAD', 1.35, CURRENT_DATE, 'manual'),
('EUR', 'CAD', 1.47, CURRENT_DATE, 'manual'),
('GBP', 'CAD', 1.72, CURRENT_DATE, 'manual'),
('JPY', 'CAD', 0.009, CURRENT_DATE, 'manual')
ON CONFLICT (base_currency, target_currency, date) DO NOTHING;

-- Mettre à jour le cache des devises
INSERT INTO public.currency_cache (base_currency, target_currency, rate, api_source) VALUES
('CAD', 'USD', 0.74, 'manual_setup'),
('CAD', 'EUR', 0.68, 'manual_setup'),
('CAD', 'JPY', 110.50, 'manual_setup'),
('USD', 'CAD', 1.35, 'manual_setup'),
('EUR', 'CAD', 1.47, 'manual_setup'),
('JPY', 'CAD', 0.009, 'manual_setup')
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
    rate = EXCLUDED.rate,
    cached_at = NOW(),
    expires_at = NOW() + INTERVAL '24 hours',
    api_source = EXCLUDED.api_source;

-- Messages de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Extension des profils utilisateur terminée !';
    RAISE NOTICE '📊 Tables créées : supported_currencies, currency_rates, currency_cache';
    RAISE NOTICE '📅 Tables créées : subscription_plans, tenant_subscriptions, subscription_renewals';
    RAISE NOTICE '🔔 Table créée : renewal_notifications';
    RAISE NOTICE '⚙️  Fonctions créées : convert_currency, get_exchange_rate, calculate_subscription_end_date';
    RAISE NOTICE '🔧 Triggers créés pour mise à jour automatique';
    RAISE NOTICE '📈 Index créés pour optimisation des performances';
    RAISE NOTICE '👁️  Vues créées : subscription_details, latest_exchange_rates';
    RAISE NOTICE '🎯 Prêt pour implémentation page profil et système multi-devises !';
END $$;
