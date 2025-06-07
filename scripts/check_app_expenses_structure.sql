-- Vérifier la structure de la table app.expenses
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' AND table_schema = 'app'
ORDER BY ordinal_position;
