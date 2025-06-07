-- Script pour ajouter les colonnes manquantes à user_profiles
-- À exécuter dans Supabase SQL Editor

DO $$ 
BEGIN
    RAISE NOTICE 'Début de l''ajout des colonnes manquantes à user_profiles...';

    -- Ajouter tenant_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'tenant_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        RAISE NOTICE 'Colonne tenant_id ajoutée à user_profiles';
    ELSE
        RAISE NOTICE 'Colonne tenant_id existe déjà';
    END IF;

    -- Ajouter role si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('superadmin', 'tenant_admin', 'employee', 'accountant', 'user'));
        RAISE NOTICE 'Colonne role ajoutée à user_profiles';
    ELSE
        RAISE NOTICE 'Colonne role existe déjà';
    END IF;

    -- Ajouter created_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée à user_profiles';
    ELSE
        RAISE NOTICE 'Colonne created_at existe déjà';
    END IF;

    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée à user_profiles';
    ELSE
        RAISE NOTICE 'Colonne updated_at existe déjà';
    END IF;

    -- Créer ou mettre à jour le trigger pour updated_at
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON public.user_profiles 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    RAISE NOTICE 'Structure de user_profiles mise à jour avec succès !';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERREUR lors de la mise à jour: %', SQLERRM;
        RAISE EXCEPTION 'Mise à jour échouée: %', SQLERRM;
END $$;
