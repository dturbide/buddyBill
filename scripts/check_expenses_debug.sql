-- Vérifier le contenu de la table expenses
SELECT 
  e.id,
  e.description,
  e.amount,
  e.currency,
  e.created_at,
  g.name as group_name,
  up.email as created_by_email
FROM app.expenses e
LEFT JOIN public.groups g ON e.group_id = g.id  
LEFT JOIN auth.users u ON e.created_by = u.id
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Vérifier les participants des dépenses
SELECT 
  ep.expense_id,
  e.description,
  ep.user_id,
  up.email,
  ep.amount_owed
FROM app.expense_participants ep
JOIN app.expenses e ON ep.expense_id = e.id
LEFT JOIN auth.users u ON ep.user_id = u.id
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Vérifier le nombre total d'entrées
SELECT 
  'expenses' as table_name, 
  COUNT(*) as count
FROM app.expenses
UNION ALL
SELECT 
  'expense_participants' as table_name, 
  COUNT(*) as count
FROM app.expense_participants;
