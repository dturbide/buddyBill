-- SCRIPT DE DIAGNOSTIC TENANT_ID
-- ================================
-- Ce script teste chaque section du schéma BuddyBill pour identifier où l'erreur tenant_id se produit

-- Test 1: Extensions et schémas
\echo '=== TEST 1: Extensions et schémas ==='
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS app_data;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS settings;

\echo 'Extensions et schémas: OK'

-- Test 2: Types ENUM
\echo '=== TEST 2: Types ENUM ==='
CREATE TYPE public.user_role AS ENUM (
    'superadmin', 'tenant_admin', 'employee', 'accountant'
);

CREATE TYPE app_data.quote_status AS ENUM (
    'draft', 'sent', 'accepted', 'rejected', 'expired'
);

CREATE TYPE app_data.job_status AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE billing.invoice_status AS ENUM (
    'draft', 'sent', 'paid', 'overdue', 'cancelled'
);

CREATE TYPE billing.payment_method AS ENUM (
    'cash', 'check', 'credit_card', 'bank_transfer', 'other'
);

\echo 'Types ENUM: OK'

-- Test 3: Table tenants
\echo '=== TEST 3: Table tenants ==='
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo 'Table tenants: OK'

-- Test 4: Table user_profiles
\echo '=== TEST 4: Table user_profiles ==='
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role public.user_role DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo 'Table user_profiles: OK'

-- Test 5: Table customers
\echo '=== TEST 5: Table customers ==='
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo 'Table customers: OK'

-- Test 6: Table services
\echo '=== TEST 6: Table services ==='
CREATE TABLE IF NOT EXISTS app_data.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_price DECIMAL(12,2),
    unit TEXT DEFAULT 'hour',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo 'Table services: OK'

-- Test 7: Table quotes (ici peut être le problème)
\echo '=== TEST 7: Table quotes ==='
CREATE TABLE IF NOT EXISTS app_data.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    status app_data.quote_status DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    terms_conditions TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, quote_number)
);

\echo 'Table quotes: OK'

-- Test 8: Index sur tenant_id
\echo '=== TEST 8: Index tenant_id ==='
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON app_data.quotes(tenant_id);

\echo 'Index tenant_id: OK'

\echo '=== DIAGNOSTIC COMPLET RÉUSSI ==='
\echo 'Si vous voyez ce message, aucune erreur tenant_id détectée'

-- Vérification finale
SELECT 'tenant_id existe dans user_profiles' as test, count(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'tenant_id';

SELECT 'tenant_id existe dans customers' as test, count(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'tenant_id';

SELECT 'tenant_id existe dans quotes' as test, count(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'quotes' AND column_name = 'tenant_id';
