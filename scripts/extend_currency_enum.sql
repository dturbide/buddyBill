-- Script pour étendre l'enum currency avec toutes les devises courantes
-- À exécuter depuis l'interface Supabase SQL Editor

DO $$
BEGIN
    -- Vérifier si le type currency existe dans public
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        RAISE NOTICE 'Enum public.currency existe, extension en cours...';
        
        -- Ajouter les nouvelles devises une par une (si elles n'existent pas déjà)
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'JPY';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'JPY déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'CHF';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'CHF déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'AUD';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'AUD déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'CNY';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'CNY déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'INR';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'INR déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'BRL';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'BRL déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'MXN';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'MXN déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'KRW';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'KRW déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'SEK';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'SEK déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'NOK';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'NOK déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'DKK';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'DKK déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'NZD';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'NZD déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'SGD';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'SGD déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'HKD';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'HKD déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'THB';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'THB déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TYPE public.currency ADD VALUE IF NOT EXISTS 'ZAR';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ZAR déjà présent dans l''enum ou erreur: %', SQLERRM;
        END;
        
        RAISE NOTICE 'Extension de l''enum public.currency terminée avec succès';
        
    ELSE 
        RAISE NOTICE 'Type currency n''existe pas dans public, création...';
        
        -- Créer l'enum avec toutes les devises courantes
        CREATE TYPE public.currency AS ENUM (
            'EUR', 'USD', 'GBP', 'CAD', 'JPY', 'CHF', 'AUD', 'CNY', 
            'INR', 'BRL', 'MXN', 'KRW', 'SEK', 'NOK', 'DKK', 'NZD', 
            'SGD', 'HKD', 'THB', 'ZAR'
        );
        
        RAISE NOTICE 'Enum public.currency créé avec toutes les devises courantes';
    END IF;
    
    -- Afficher les valeurs finales de l'enum
    RAISE NOTICE 'Valeurs actuelles de l''enum public.currency:';
    PERFORM array_agg(enumlabel ORDER BY enumsortorder) 
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'currency' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));
    
END $$;
