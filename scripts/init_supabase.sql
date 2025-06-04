-- --------------------------------------------------
-- INIT SUPABASE MULTI-TENANT (DASHBOARD EXPENSE SHARING)
-- Schémas, tables, fonctions, RLS, rôles
-- --------------------------------------------------

-- 1. Création des schémas
CREATE SCHEMA IF NOT EXISTS app_data;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS settings;

-- 2. Tables principales (public)
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('superadmin', 'tenant_admin', 'employee', 'accountant')),
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Tables app_data (clients, devis, jobs, etc.)
CREATE TABLE IF NOT EXISTS app_data.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_data.quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    status TEXT,
    amount NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_data.quote_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    quote_id uuid NOT NULL REFERENCES app_data.quotes(id) ON DELETE CASCADE,
    description TEXT,
    quantity INT,
    unit_price NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS app_data.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
    quote_id uuid REFERENCES app_data.quotes(id) ON DELETE SET NULL,
    job_number TEXT NOT NULL,
    status TEXT,
    start_date DATE,
    end_date DATE
);

CREATE TABLE IF NOT EXISTS app_data.job_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES app_data.jobs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    duration INTERVAL
);

-- 4. Tables billing (factures, paiements)
CREATE TABLE IF NOT EXISTS billing.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
    job_id uuid REFERENCES app_data.jobs(id) ON DELETE SET NULL,
    amount NUMERIC(12,2),
    status TEXT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT now()
);

-- 5. Tables settings (exemple)
CREATE TABLE IF NOT EXISTS settings.tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB
);

-- 6. Fonctions d’authentification pour RLS
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'role', '');
$$ LANGUAGE sql STABLE;

-- 7. Politiques RLS (exemples)
-- Tenants : superadmin accès total, autres accès restreint
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON public.tenants
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant propre" ON public.tenants
  FOR ALL USING (id = auth.tenant_id());

-- user_profiles : accès restreint par tenant
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON public.user_profiles
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès profil tenant" ON public.user_profiles
  FOR ALL USING (tenant_id = auth.tenant_id());

-- app_data.customers : accès restreint par tenant
ALTER TABLE app_data.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON app_data.customers
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant" ON app_data.customers
  FOR ALL USING (tenant_id = auth.tenant_id());

-- app_data.quotes : idem
ALTER TABLE app_data.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON app_data.quotes
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant" ON app_data.quotes
  FOR ALL USING (tenant_id = auth.tenant_id());

-- app_data.jobs : idem
ALTER TABLE app_data.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON app_data.jobs
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant" ON app_data.jobs
  FOR ALL USING (tenant_id = auth.tenant_id());

-- app_data.job_entries : accès lecture/écriture pour owner, lecture pour admin
ALTER TABLE app_data.job_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON app_data.job_entries
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant" ON app_data.job_entries
  FOR ALL USING (tenant_id = auth.tenant_id());
CREATE POLICY "Lecture/écriture own entries" ON app_data.job_entries
  FOR SELECT, INSERT, UPDATE, DELETE USING (user_id = auth.uid() AND tenant_id = auth.tenant_id());

-- billing.invoices : accès restreint par tenant
ALTER TABLE billing.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON billing.invoices
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant" ON billing.invoices
  FOR ALL USING (tenant_id = auth.tenant_id());

-- settings.tenant_settings : accès restreint par tenant
ALTER TABLE settings.tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin accès total" ON settings.tenant_settings
  FOR ALL USING (auth.role() = 'superadmin');
CREATE POLICY "Accès tenant" ON settings.tenant_settings
  FOR ALL USING (tenant_id = auth.tenant_id());

-- 8. Index utiles
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON app_data.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON app_data.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON app_data.jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_entries_tenant_id ON app_data.job_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON billing.invoices(tenant_id);

-- 9. (Optionnel) Vue d’administration pour superadmin
-- CREATE VIEW public.admin_dashboard AS ...

-- Fin du script
