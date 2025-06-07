-- Script pour vérifier la structure de la table groups
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table groups
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'groups'
ORDER BY ordinal_position;

-- 2. Vérifier si la table groups existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'groups';

-- 3. Voir les colonnes disponibles dans la table groups
\d public.groups;
