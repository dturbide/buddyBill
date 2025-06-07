-- BUDDYBILL - NETTOYAGE COMPLET
-- Script 000: Suppression complète des schémas existants
-- =====================================================
-- ATTENTION: Ce script supprime TOUTES les données BuddyBill !
-- Exécuter seulement si vous voulez repartir de zéro

-- 1. Supprimer tous les triggers
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON app_data.quotes;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON app_data.jobs;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON billing.invoices;
DROP TRIGGER IF EXISTS update_payments_updated_at ON billing.payments;

-- 2. Supprimer toutes les fonctions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS auth.tenant_id();
DROP FUNCTION IF EXISTS auth.role();

-- 3. Supprimer tous les index
DROP INDEX IF EXISTS idx_user_profiles_tenant_id;
DROP INDEX IF EXISTS idx_customers_tenant_id;
DROP INDEX IF EXISTS idx_quotes_tenant_id;
DROP INDEX IF EXISTS idx_quotes_customer_id;
DROP INDEX IF EXISTS idx_jobs_tenant_id;
DROP INDEX IF EXISTS idx_jobs_customer_id;
DROP INDEX IF EXISTS idx_invoices_tenant_id;
DROP INDEX IF EXISTS idx_invoices_customer_id;
DROP INDEX IF EXISTS idx_payments_invoice_id;

-- 4. Supprimer toutes les tables dans l'ordre des dépendances
-- Settings
DROP TABLE IF EXISTS settings.tenant_settings CASCADE;
DROP TABLE IF EXISTS settings.api_keys CASCADE;
DROP TABLE IF EXISTS settings.invoice_templates CASCADE;

-- Billing
DROP TABLE IF EXISTS billing.payments CASCADE;
DROP TABLE IF EXISTS billing.invoice_items CASCADE;
DROP TABLE IF EXISTS billing.invoices CASCADE;
DROP TABLE IF EXISTS billing.subscriptions CASCADE;

-- App Data
DROP TABLE IF EXISTS app_data.job_entries CASCADE;
DROP TABLE IF EXISTS app_data.jobs CASCADE;
DROP TABLE IF EXISTS app_data.quote_items CASCADE;
DROP TABLE IF EXISTS app_data.quotes CASCADE;
DROP TABLE IF EXISTS app_data.services CASCADE;

-- Public
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- 5. Supprimer tous les types ENUM
DROP TYPE IF EXISTS billing.payment_method CASCADE;
DROP TYPE IF EXISTS billing.invoice_status CASCADE;
DROP TYPE IF EXISTS app_data.job_status CASCADE;
DROP TYPE IF EXISTS app_data.quote_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- 6. Supprimer les schémas (optionnel - laisse les schémas pour éviter les erreurs)
-- DROP SCHEMA IF EXISTS settings CASCADE;
-- DROP SCHEMA IF EXISTS billing CASCADE;
-- DROP SCHEMA IF EXISTS app_data CASCADE;

\echo 'Nettoyage BuddyBill terminé. Vous pouvez maintenant exécuter 001_schema_buddybill.sql'
