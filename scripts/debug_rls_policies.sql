-- Diagnostic des politiques RLS sur app.expenses

-- 1. Vérifier si RLS est activé
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'app' AND tablename = 'expenses';

-- 2. Lister toutes les politiques RLS sur app.expenses
SELECT 
  pol.polname AS policy_name,
  pol.polcmd AS policy_command,
  pol.polpermissive AS permissive,
  pol.polroles AS roles,
  pol.polqual AS policy_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'app' AND cls.relname = 'expenses';

-- 3. Tester insertion directe sans RLS (avec BYPASSRLS)
SET session_replication_role = replica; -- Désactive temporairement RLS

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
  'a9e8caa8-db64-4199-b2bc-ede26a25665c',
  'Test BYPASS RLS',
  25.00,
  NULL,
  'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8',
  'USD',
  'equal',
  'ae15ce65-ae91-4863-89e3-ce1c1f8b0ca8',
  NOW()
);

-- 4. Vérifier que l'insertion a fonctionné
SELECT * FROM app.expenses WHERE description = 'Test BYPASS RLS';

-- 5. Rétablir RLS
SET session_replication_role = DEFAULT;
