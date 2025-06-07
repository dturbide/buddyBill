-- =====================================================
-- BUDDYBILL - SCHÉMA DE BASE
-- Script 001: Configuration initiale et tables principales
-- =====================================================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Création des schémas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS app_data;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS settings;

-- 3. Types personnalisés (ENUM)
DO $$ 
BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'superadmin', 'tenant_admin', 'employee', 'accountant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE app_data.quote_status AS ENUM (
        'draft', 'sent', 'accepted', 'rejected', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE app_data.job_status AS ENUM (
        'scheduled', 'in_progress', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE billing.invoice_status AS ENUM (
        'draft', 'sent', 'paid', 'overdue', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE billing.payment_method AS ENUM (
        'cash', 'check', 'credit_card', 'bank_transfer', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Tables principales

-- 4.1 Tenants (entreprises clientes)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_tier TEXT DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID,  
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'employee',
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.3 Clients
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB, -- {street, city, state, zip, country}
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.4 Services
CREATE TABLE IF NOT EXISTS app_data.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_price DECIMAL(12,2),
    unit TEXT DEFAULT 'hour', -- hour, fixed, unit, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.5 Devis (Quotes)
CREATE TABLE IF NOT EXISTS app_data.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    title TEXT,
    description TEXT,
    status app_data.quote_status DEFAULT 'draft',
    valid_until DATE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    terms_conditions TEXT,
    created_by UUID, -- REFERENCES public.user_profiles(id) - ajouté plus tard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, quote_number)
);

-- 4.6 Items de devis
CREATE TABLE IF NOT EXISTS app_data.quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES app_data.quotes(id) ON DELETE CASCADE,
    service_id UUID REFERENCES app_data.services(id),
    description TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.7 Jobs/Interventions
CREATE TABLE IF NOT EXISTS app_data.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES app_data.quotes(id),
    job_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status app_data.job_status DEFAULT 'scheduled',
    scheduled_date DATE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID[] DEFAULT '{}', -- Array of user_profile ids
    notes TEXT,
    created_by UUID, -- REFERENCES public.user_profiles(id) - ajouté plus tard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, job_number)
);

-- 4.8 Entrées de temps (pour les jobs)
CREATE TABLE IF NOT EXISTS app_data.job_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES app_data.jobs(id) ON DELETE CASCADE,
    user_id UUID, -- REFERENCES public.user_profiles(id) - ajouté plus tard
    entry_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration INTERVAL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.9 Factures
CREATE TABLE IF NOT EXISTS billing.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES app_data.jobs(id),
    quote_id UUID REFERENCES app_data.quotes(id),
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status billing.invoice_status DEFAULT 'draft',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    terms_conditions TEXT,
    created_by UUID, -- REFERENCES public.user_profiles(id) - ajouté plus tard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);

-- 4.10 Items de facture
CREATE TABLE IF NOT EXISTS billing.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.11 Paiements
CREATE TABLE IF NOT EXISTS billing.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method billing.payment_method,
    reference_number TEXT,
    notes TEXT,
    created_by UUID, -- REFERENCES public.user_profiles(id) - ajouté plus tard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON app_data.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON app_data.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON app_data.jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON app_data.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON billing.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON billing.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON billing.payments(invoice_id);

-- 6. Fonctions utilitaires pour tenant_id
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role';
$$ LANGUAGE SQL STABLE;

-- 7. Triggers pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON app_data.quotes;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON app_data.jobs;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON app_data.quotes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON app_data.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 7. AJOUT DES CONTRAINTES FK VERS USER_PROFILES
-- Ajouté après création de toutes les tables pour éviter les dépendances circulaires
-- ==========================================

-- Ajouter les contraintes FK vers user_profiles seulement si les colonnes existent
DO $$
BEGIN
    -- Contrainte FK pour quotes.created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app_data' AND table_name = 'quotes' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE app_data.quotes 
        ADD CONSTRAINT fk_quotes_created_by 
        FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);
    END IF;

    -- Contrainte FK pour jobs.created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app_data' AND table_name = 'jobs' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE app_data.jobs 
        ADD CONSTRAINT fk_jobs_created_by 
        FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);
    END IF;

    -- Contrainte FK pour job_entries.user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app_data' AND table_name = 'job_entries' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE app_data.job_entries 
        ADD CONSTRAINT fk_job_entries_user_id 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
    END IF;

    -- Contrainte FK pour invoices.created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'billing' AND table_name = 'invoices' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE billing.invoices 
        ADD CONSTRAINT fk_invoices_created_by 
        FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);
    END IF;

    -- Contrainte FK pour payments.created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'billing' AND table_name = 'payments' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE billing.payments 
        ADD CONSTRAINT fk_payments_created_by 
        FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);
    END IF;
    
END $$;
