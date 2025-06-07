-- Script pour ajouter les colonnes de suppression soft aux groupes
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour la suppression soft
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS recover_until TIMESTAMPTZ NULL;

-- Ajouter des commentaires pour documenter
COMMENT ON COLUMN public.groups.deleted_at IS 'Date de suppression soft du groupe';
COMMENT ON COLUMN public.groups.recover_until IS 'Date limite pour récupérer le groupe (30 jours après suppression)';

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'groups' 
AND column_name IN ('deleted_at', 'recover_until');
