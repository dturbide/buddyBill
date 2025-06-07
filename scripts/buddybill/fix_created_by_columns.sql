-- Script pour ajouter les colonnes created_by manquantes
-- À exécuter si les tables existent déjà sans ces colonnes

DO $$
BEGIN
    -- Ajouter created_by à quotes si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app_data' AND table_name = 'quotes' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE app_data.quotes ADD COLUMN created_by UUID;
        RAISE NOTICE 'Colonne created_by ajoutée à app_data.quotes';
    END IF;

    -- Ajouter created_by à jobs si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app_data' AND table_name = 'jobs' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE app_data.jobs ADD COLUMN created_by UUID;
        RAISE NOTICE 'Colonne created_by ajoutée à app_data.jobs';
    END IF;

    -- Ajouter created_by à invoices si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'billing' AND table_name = 'invoices' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE billing.invoices ADD COLUMN created_by UUID;
        RAISE NOTICE 'Colonne created_by ajoutée à billing.invoices';
    END IF;

    -- Ajouter created_by à payments si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'billing' AND table_name = 'payments' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE billing.payments ADD COLUMN created_by UUID;
        RAISE NOTICE 'Colonne created_by ajoutée à billing.payments';
    END IF;

END $$;
