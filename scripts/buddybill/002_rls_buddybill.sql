-- =====================================================
-- BUDDYBILL - POLITIQUES RLS
-- Script 002: Row Level Security
-- =====================================================

-- 1. Activer RLS sur toutes les tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data.job_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.payments ENABLE ROW LEVEL SECURITY;

-- 2. Politiques pour TENANTS
-- Superadmin peut tout voir
CREATE POLICY "Superadmin can view all tenants" ON public.tenants
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'superadmin');

-- Les utilisateurs peuvent voir leur propre tenant
CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT TO authenticated
    USING (id = public.get_tenant_id());

-- Seul superadmin peut créer/modifier/supprimer des tenants
CREATE POLICY "Only superadmin can manage tenants" ON public.tenants
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'superadmin')
    WITH CHECK (public.get_user_role() = 'superadmin');

-- 3. Politiques pour USER_PROFILES
-- Superadmin peut tout voir
CREATE POLICY "Superadmin can view all profiles" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'superadmin');

-- Les utilisateurs peuvent voir les profils de leur tenant
CREATE POLICY "Users can view profiles in same tenant" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_tenant_id());

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND tenant_id = public.get_tenant_id());

-- Tenant admin peut gérer les profils de son tenant
CREATE POLICY "Tenant admin can manage profiles" ON public.user_profiles
    FOR ALL TO authenticated
    USING (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'tenant_admin')
    WITH CHECK (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'tenant_admin');

-- 4. Politiques pour CUSTOMERS
-- Tous les utilisateurs du tenant peuvent voir les clients
CREATE POLICY "Tenant users can view customers" ON public.customers
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_tenant_id());

-- Tenant admin et employees peuvent créer/modifier des clients
CREATE POLICY "Tenant admin and employees can manage customers" ON public.customers
    FOR ALL TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'employee')
    )
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'employee')
    );

-- 5. Politiques pour SERVICES
CREATE POLICY "Tenant users can view services" ON app_data.services
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_tenant_id());

CREATE POLICY "Tenant admin can manage services" ON app_data.services
    FOR ALL TO authenticated
    USING (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'tenant_admin')
    WITH CHECK (tenant_id = public.get_tenant_id() AND public.get_user_role() = 'tenant_admin');

-- 6. Politiques pour QUOTES
CREATE POLICY "Tenant users can view quotes" ON app_data.quotes
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_tenant_id());

CREATE POLICY "Tenant admin and employees can manage quotes" ON app_data.quotes
    FOR ALL TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'employee')
    )
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'employee')
    );

-- 7. Politiques pour QUOTE_ITEMS
CREATE POLICY "Tenant users can view quote items" ON app_data.quote_items
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_tenant_id());

CREATE POLICY "Quote creators can manage quote items" ON app_data.quote_items
    FOR ALL TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND EXISTS (
            SELECT 1 FROM app_data.quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.created_by = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND EXISTS (
            SELECT 1 FROM app_data.quotes 
            WHERE quotes.id = quote_items.quote_id 
            AND quotes.created_by = auth.uid()
        )
    );

-- 8. Politiques pour JOBS
CREATE POLICY "Tenant users can view jobs" ON app_data.jobs
    FOR SELECT TO authenticated
    USING (tenant_id = public.get_tenant_id());

CREATE POLICY "Assigned users can update jobs" ON app_data.jobs
    FOR UPDATE TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND (
            public.get_user_role() IN ('tenant_admin', 'employee')
            OR auth.uid() = ANY(assigned_to)
        )
    );

CREATE POLICY "Admin and employees can create jobs" ON app_data.jobs
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'employee')
    );

-- 9. Politiques pour JOB_ENTRIES
CREATE POLICY "Users can view own job entries" ON app_data.job_entries
    FOR SELECT TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND (user_id = auth.uid() OR public.get_user_role() = 'tenant_admin')
    );

CREATE POLICY "Users can create own job entries" ON app_data.job_entries
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update own job entries" ON app_data.job_entries
    FOR UPDATE TO authenticated
    USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid())
    WITH CHECK (tenant_id = public.get_tenant_id() AND user_id = auth.uid());

-- 10. Politiques pour INVOICES
CREATE POLICY "Tenant users can view invoices" ON billing.invoices
    FOR SELECT TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND (
            public.get_user_role() IN ('tenant_admin', 'accountant')
            OR created_by = auth.uid()
        )
    );

CREATE POLICY "Admin and accountant can manage invoices" ON billing.invoices
    FOR ALL TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    )
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    );

-- 11. Politiques pour INVOICE_ITEMS
CREATE POLICY "Can view invoice items with invoice access" ON billing.invoice_items
    FOR SELECT TO authenticated
    USING (
        tenant_id = public.get_tenant_id()
        AND EXISTS (
            SELECT 1 FROM billing.invoices 
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.tenant_id = public.get_tenant_id()
        )
    );

CREATE POLICY "Can manage invoice items with invoice access" ON billing.invoice_items
    FOR ALL TO authenticated
    USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    )
    WITH CHECK (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    );

-- 12. Politiques pour PAYMENTS
CREATE POLICY "Can view payments" ON billing.payments
    FOR SELECT TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    );

CREATE POLICY "Can manage payments" ON billing.payments
    FOR ALL TO authenticated
    USING (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    )
    WITH CHECK (
        tenant_id = public.get_tenant_id() 
        AND public.get_user_role() IN ('tenant_admin', 'accountant')
    );

-- 13. Fonction pour ajouter tenant_id et role au JWT
CREATE OR REPLACE FUNCTION public.get_user_claims(user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'tenant_id', tenant_id,
    'role', role::text
  )
  FROM public.user_profiles
  WHERE id = user_id;
$$;
