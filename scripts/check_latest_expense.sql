-- Vérifier la dernière dépense et ses participants
SELECT 
  e.id,
  e.description,
  e.amount,
  e.paid_by,
  e.expense_date,
  e.created_at,
  COUNT(ep.user_id) as participant_count
FROM app.expenses e
LEFT JOIN app.expense_participants ep ON e.id = ep.expense_id
WHERE e.amount = 50.00
GROUP BY e.id, e.description, e.amount, e.paid_by, e.expense_date, e.created_at
ORDER BY e.created_at DESC
LIMIT 3;
