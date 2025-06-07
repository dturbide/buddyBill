-- Script pour ajouter seulement la colonne role à user_profiles
-- À exécuter dans Supabase SQL Editor

DO $$ 
BEGIN
    RAISE NOTICE 'Ajout de la colonne role à user_profiles...';

    -- Ajouter role si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));
        RAISE NOTICE 'Colonne role ajoutée à user_profiles';
        
        -- Mettre à jour tous les utilisateurs existants avec le rôle 'user'
        UPDATE public.user_profiles SET role = 'user' WHERE role IS NULL;
        RAISE NOTICE 'Rôles des utilisateurs existants mis à jour';
    ELSE
        RAISE NOTICE 'Colonne role existe déjà';
    END IF;

    RAISE NOTICE 'Mise à jour terminée avec succès !';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERREUR: %', SQLERRM;
        RAISE EXCEPTION 'Mise à jour échouée: %', SQLERRM;
END $$;
