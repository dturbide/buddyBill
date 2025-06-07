-- CORRECTION DE LA TABLE USER_PROFILES EXISTANTE
-- ================================================
-- Ajoute les colonnes manquantes sans détruire les données existantes

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. S'assurer que la table tenants existe d'abord
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer le type ENUM s'il n'existe pas (pour future migration)
DO $$ 
BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'superadmin', 'tenant_admin', 'employee', 'accountant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Ajouter les colonnes manquantes à user_profiles existante
-- Ajout de tenant_id
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Ajout de email
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Ajout de is_active
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ajout de auth_user_id
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- 5. Créer un tenant par défaut si aucun n'existe
INSERT INTO public.tenants (id, name, status) 
VALUES (
    'a0000000-0000-0000-0000-000000000000'::uuid,
    'Tenant par défaut', 
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 6. Mettre à jour les user_profiles existants avec le tenant par défaut
UPDATE public.user_profiles 
SET tenant_id = 'a0000000-0000-0000-0000-000000000000'::uuid 
WHERE tenant_id IS NULL;

-- Table user_profiles mise à jour avec succès!
-- Colonnes ajoutées: tenant_id, email, is_active, auth_user_id
-- Vous pouvez maintenant exécuter le script 001_schema_buddybill.sql
