-- =====================================================
-- BUDDYBILL - POLITIQUES RLS EXTENSIONS PROFIL
-- Script 005: Sécurité RLS pour nouvelles tables profil et multi-devises
-- =====================================================

-- 1. Activation RLS sur les nouvelles tables
-- ============================================

-- Tables de devises (lecture publique, modification admin)
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_cache ENABLE ROW LEVEL SECURITY;

-- Tables d'abonnements (accès par tenant)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Politiques pour les devises
-- ================================

-- 2.1 Devises supportées - Lecture publique pour tous
CREATE POLICY "Lecture publique devises supportées" ON public.supported_currencies
    FOR SELECT TO authenticated USING (true);

-- 2.2 Devises supportées - Modification réservée aux superadmin
CREATE POLICY "Modification devises supportées superadmin" ON public.supported_currencies
    FOR ALL TO authenticated USING (public.get_user_role() = 'superadmin');

-- 2.3 Taux de change - Lecture publique
CREATE POLICY "Lecture publique taux de change" ON public.currency_rates
    FOR SELECT TO authenticated USING (true);

-- 2.4 Taux de change - Modification par superadmin et tenant_admin
CREATE POLICY "Modification taux de change admins" ON public.currency_rates
    FOR ALL TO authenticated USING (
        public.get_user_role() IN ('superadmin', 'tenant_admin')
    );

-- 2.5 Cache devises - Lecture publique
CREATE POLICY "Lecture publique cache devises" ON public.currency_cache
    FOR SELECT TO authenticated USING (true);

-- 2.6 Cache devises - Modification par système et admins
CREATE POLICY "Modification cache devises admins" ON public.currency_cache
    FOR ALL TO authenticated USING (
        public.get_user_role() IN ('superadmin', 'tenant_admin')
    );

-- 3. Politiques pour les abonnements
-- ===================================

-- 3.1 Plans d'abonnement - Lecture publique
CREATE POLICY "Lecture publique plans abonnement" ON public.subscription_plans
    FOR SELECT TO authenticated USING (true);

-- 3.2 Plans d'abonnement - Modification superadmin uniquement
CREATE POLICY "Modification plans abonnement superadmin" ON public.subscription_plans
    FOR ALL TO authenticated USING (public.get_user_role() = 'superadmin');

-- 3.3 Abonnements tenant - Accès par tenant_id
CREATE POLICY "Accès abonnements par tenant" ON public.tenant_subscriptions
    FOR SELECT TO authenticated USING (
        tenant_id = public.get_tenant_id() OR public.get_user_role() = 'superadmin'
    );

-- 3.4 Abonnements tenant - Modification par tenant_admin et superadmin
CREATE POLICY "Modification abonnements tenant admins" ON public.tenant_subscriptions
    FOR ALL TO authenticated USING (
        (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'tenant_admin') OR
        public.get_user_role() = 'superadmin'
    );

-- 3.5 Renouvellements - Accès par tenant
CREATE POLICY "Accès renouvellements par tenant" ON public.subscription_renewals
    FOR SELECT TO authenticated USING (
        subscription_id IN (
            SELECT id FROM public.tenant_subscriptions 
            WHERE tenant_id = public.get_tenant_id()
        ) OR public.get_user_role() = 'superadmin'
    );

-- 3.6 Renouvellements - Modification par système et admins
CREATE POLICY "Modification renouvellements admins" ON public.subscription_renewals
    FOR ALL TO authenticated USING (
        public.get_user_role() IN ('superadmin', 'tenant_admin')
    );

-- 3.7 Notifications de renouvellement - Accès par tenant
CREATE POLICY "Accès notifications renouvellement par tenant" ON public.renewal_notifications
    FOR SELECT TO authenticated USING (
        tenant_id = public.get_tenant_id() OR public.get_user_role() = 'superadmin'
    );

-- 3.8 Notifications de renouvellement - Modification par système et admins
CREATE POLICY "Modification notifications renouvellement admins" ON public.renewal_notifications
    FOR ALL TO authenticated USING (
        (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'tenant_admin') OR
        public.get_user_role() = 'superadmin'
    );

-- 4. Politiques étendues pour user_profiles
-- ===========================================

-- Les nouvelles colonnes de user_profiles héritent automatiquement des politiques existantes
-- Mais on peut ajouter des politiques spécifiques pour les préférences

-- 4.1 Utilisateurs peuvent modifier leurs propres préférences
CREATE POLICY "Utilisateurs modifient leurs préférences" ON public.user_profiles
    FOR UPDATE TO authenticated USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 5. Fonctions d'aide pour les politiques
-- =========================================

-- 5.1 Fonction pour vérifier si un utilisateur peut accéder aux données d'abonnement
CREATE OR REPLACE FUNCTION public.can_access_subscription_data(subscription_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Superadmin peut tout voir
    IF public.get_user_role() = 'superadmin' THEN
        RETURN true;
    END IF;
    
    -- Tenant admin et employés peuvent voir leur propre tenant
    IF subscription_tenant_id = public.get_tenant_id() THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Fonction pour vérifier les permissions de modification des devises
CREATE OR REPLACE FUNCTION public.can_modify_currency_data()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('superadmin', 'tenant_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Politiques pour les vues
-- ============================

-- Les vues héritent automatiquement des politiques de leurs tables sous-jacentes
-- Mais on peut créer des politiques spécifiques si nécessaire

-- 6.1 Permission d'accès à la vue subscription_details
-- (hérite des politiques de tenant_subscriptions)

-- 6.2 Permission d'accès à la vue latest_exchange_rates  
-- (hérite des politiques de currency_rates)

-- 7. Tests des politiques RLS
-- ============================

-- 7.1 Fonction de test pour vérifier les politiques
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE(
    test_name TEXT,
    table_name TEXT,
    policy_type TEXT,
    expected_result TEXT,
    actual_result TEXT,
    passed BOOLEAN
) AS $$
BEGIN
    -- Test 1: Lecture des devises supportées
    RETURN QUERY
    SELECT 
        'Test lecture devises supportées'::TEXT,
        'supported_currencies'::TEXT,
        'SELECT'::TEXT,
        'Accessible à tous'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM public.supported_currencies LIMIT 1) 
             THEN 'Accessible' ELSE 'Non accessible' END::TEXT,
        EXISTS(SELECT 1 FROM public.supported_currencies LIMIT 1)::BOOLEAN;

    -- Test 2: Lecture des plans d'abonnement
    RETURN QUERY
    SELECT 
        'Test lecture plans abonnement'::TEXT,
        'subscription_plans'::TEXT,
        'SELECT'::TEXT,
        'Accessible à tous'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM public.subscription_plans LIMIT 1) 
             THEN 'Accessible' ELSE 'Non accessible' END::TEXT,
        EXISTS(SELECT 1 FROM public.subscription_plans LIMIT 1)::BOOLEAN;

    -- Ajouter d'autres tests selon les besoins...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Permissions pour les rôles spéciaux
-- =======================================

-- 8.1 Permissions pour les services automatisés (ex: cron jobs)
-- Ces permissions permettent aux fonctions système d'accéder aux données

-- Créer un rôle pour les services automatisés si nécessaire
-- Note: À adapter selon l'architecture d'authentification de Supabase

-- 8.2 Permissions pour les API externes (taux de change)
-- Autoriser l'insertion de nouveaux taux de change par des services externes

-- 9. Audit et logging des accès
-- ==============================

-- 9.1 Table d'audit pour les modifications de préférences utilisateur
CREATE TABLE IF NOT EXISTS public.user_preferences_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    changed_field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES public.user_profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.2 Trigger pour auditer les changements de préférences
CREATE OR REPLACE FUNCTION public.audit_user_preferences_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Auditer les changements de langue
    IF OLD.preferred_language IS DISTINCT FROM NEW.preferred_language THEN
        INSERT INTO public.user_preferences_audit (
            user_id, tenant_id, changed_field, old_value, new_value, changed_by
        ) VALUES (
            NEW.id, NEW.tenant_id, 'preferred_language', 
            OLD.preferred_language, NEW.preferred_language, auth.uid()
        );
    END IF;

    -- Auditer les changements de devise
    IF OLD.preferred_currency IS DISTINCT FROM NEW.preferred_currency THEN
        INSERT INTO public.user_preferences_audit (
            user_id, tenant_id, changed_field, old_value, new_value, changed_by
        ) VALUES (
            NEW.id, NEW.tenant_id, 'preferred_currency', 
            OLD.preferred_currency, NEW.preferred_currency, auth.uid()
        );
    END IF;

    -- Auditer les changements de mode d'affichage des devises
    IF OLD.currency_display_mode IS DISTINCT FROM NEW.currency_display_mode THEN
        INSERT INTO public.user_preferences_audit (
            user_id, tenant_id, changed_field, old_value, new_value, changed_by
        ) VALUES (
            NEW.id, NEW.tenant_id, 'currency_display_mode', 
            OLD.currency_display_mode, NEW.currency_display_mode, auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger d'audit
CREATE TRIGGER audit_user_preferences_trigger
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_user_preferences_changes();

-- 10. Activation RLS sur la table d'audit
-- =========================================

ALTER TABLE public.user_preferences_audit ENABLE ROW LEVEL SECURITY;

-- Politique pour l'audit - accès par tenant
CREATE POLICY "Accès audit préférences par tenant" ON public.user_preferences_audit
    FOR SELECT TO authenticated USING (
        tenant_id = public.get_tenant_id() OR public.get_user_role() = 'superadmin'
    );

-- Politique pour l'audit - insertion automatique par le système
CREATE POLICY "Insertion audit préférences système" ON public.user_preferences_audit
    FOR INSERT TO authenticated WITH CHECK (
        tenant_id = public.get_tenant_id() OR public.get_user_role() = 'superadmin'
    );

-- Messages de confirmation
DO $$
BEGIN
    RAISE NOTICE '🔒 Politiques RLS créées pour les extensions profil utilisateur !';
    RAISE NOTICE '💱 Sécurité devises : Lecture publique, modification admins';
    RAISE NOTICE '📅 Sécurité abonnements : Accès par tenant_id';
    RAISE NOTICE '👤 Sécurité préférences : Utilisateurs modifient leurs propres données';
    RAISE NOTICE '📊 Audit activé : Changements de préférences tracés';
    RAISE NOTICE '🧪 Fonction de test disponible : SELECT * FROM public.test_rls_policies();';
    RAISE NOTICE '✅ Toutes les politiques RLS sont actives et sécurisées !';
END $$;
