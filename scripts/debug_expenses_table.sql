-- Script pour diagnostiquer la table app.expenses
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table app.expenses
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'app' AND table_name = 'expenses'
ORDER BY ordinal_position;

-- 2. Vérifier les politiques RLS sur app.expenses
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'app' AND tablename = 'expenses';

-- 3. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'app' AND tablename = 'expenses';

-- 4. Tester une insertion simple directement en SQL
-- (remplacez les UUID par des vrais)
INSERT INTO app.expenses (
  group_id,
  description,
  amount,
  category_id,
  paid_by,
  currency,
  split_type,
  created_by,
  expense_date
) VALUES (
  'c3f94b3e-c7cc-4285-879b-ed1434004510', 
  'Test insertion SQL',
  15.50,
  NULL, -- category_id est NULL car '1' n'est pas un UUID valide
  'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8',
  'USD',
  'equal',
  'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8',
  NOW()
);

-- 5. Vérifier que l'insertion a fonctionné
SELECT * FROM app.expenses WHERE description = 'Test insertion SQL';
