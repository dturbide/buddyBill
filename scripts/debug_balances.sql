-- Script de diagnostic pour comprendre pourquoi les balances sont à $0

-- 1. Vérifier les dépenses du mois
SELECT 
  e.id,
  e.description,
  e.amount,
  e.paid_by,
  e.expense_date,
  g.name as group_name,
  u.email as paid_by_email
FROM app.expenses e
JOIN public.groups g ON e.group_id = g.id
LEFT JOIN auth.users u ON e.paid_by = u.id
WHERE e.expense_date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY e.expense_date DESC;

-- 2. Vérifier les participants de ces dépenses
SELECT 
  ep.expense_id,
  ep.user_id,
  ep.share_amount,
  u.email as participant_email,
  e.description,
  e.amount
FROM app.expense_participants ep
JOIN app.expenses e ON ep.expense_id = e.id
LEFT JOIN auth.users u ON ep.user_id = u.id
WHERE e.expense_date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY ep.expense_id;

-- 3. Vérifier l'utilisateur actuel
SELECT id, email FROM auth.users WHERE email LIKE '%denturbide%';

-- 4. Compter les participants par dépense
SELECT 
  e.id,
  e.description,
  e.amount,
  e.paid_by,
  COUNT(ep.user_id) as participant_count
FROM app.expenses e
LEFT JOIN app.expense_participants ep ON e.id = ep.expense_id
WHERE e.expense_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY e.id, e.description, e.amount, e.paid_by
ORDER BY e.expense_date DESC;
