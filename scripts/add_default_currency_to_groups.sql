-- Migration: Ajouter default_currency à la table groups
-- =====================================================

-- Ajouter la colonne default_currency si elle n'existe pas
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'EUR';

-- Mettre à jour les groupes existants qui n'ont pas de devise
UPDATE public.groups 
SET default_currency = 'EUR' 
WHERE default_currency IS NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.groups.default_currency IS 'Devise par défaut du groupe utilisée pour les nouvelles dépenses';
