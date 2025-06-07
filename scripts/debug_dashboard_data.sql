-- Test script pour vérifier les données du dashboard
-- Pour utilisateur denturbide@gmail.com

-- 1. Vérifier l'utilisateur
SELECT 
  u.id as user_id,
  u.email,
  up.full_name
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'denturbide@gmail.com';

-- 2. Vérifier les groupes de l'utilisateur
SELECT 
  g.id as group_id,
  g.name as group_name,
  g.default_currency,
  gm.role,
  gm.joined_at,
  gm.left_at
FROM public.groups g
JOIN public.group_members gm ON g.id = gm.group_id
JOIN auth.users u ON gm.user_id = u.id
WHERE u.email = 'denturbide@gmail.com'
  AND gm.left_at IS NULL
  AND g.deleted_at IS NULL;

-- 3. Vérifier les dépenses récentes
SELECT 
  e.id,
  e.description,
  e.amount,
  e.currency,
  e.expense_date,
  g.name as group_name,
  DATE_PART('day', NOW() - e.expense_date) as days_ago
FROM app.expenses e
JOIN public.groups g ON e.group_id = g.id
JOIN public.group_members gm ON g.id = gm.group_id
JOIN auth.users u ON gm.user_id = u.id
WHERE u.email = 'denturbide@gmail.com'
  AND gm.left_at IS NULL
  AND g.deleted_at IS NULL
  AND e.expense_date >= (NOW() - INTERVAL '30 days')
ORDER BY e.expense_date DESC;

-- 4. Calculer les totaux du mois
SELECT 
  COUNT(e.id) as total_expenses,
  SUM(e.amount) as total_amount,
  g.default_currency
FROM app.expenses e
JOIN public.groups g ON e.group_id = g.id
JOIN public.group_members gm ON g.id = gm.group_id
JOIN auth.users u ON gm.user_id = u.id
WHERE u.email = 'denturbide@gmail.com'
  AND gm.left_at IS NULL
  AND g.deleted_at IS NULL
  AND e.expense_date >= DATE_TRUNC('month', NOW())
GROUP BY g.default_currency;
