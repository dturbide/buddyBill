-- Créer une fonction RPC pour insérer directement dans app.expenses
-- Cela nous permettra de voir les erreurs plus clairement

CREATE OR REPLACE FUNCTION create_expense_direct(
  p_group_id UUID,
  p_description TEXT,
  p_amount DECIMAL,
  p_paid_by UUID,
  p_created_by UUID,
  p_category_id UUID DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_split_type TEXT DEFAULT 'equal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Utilise les privilèges du créateur de la fonction
AS $$
DECLARE
  v_expense_id UUID;
  v_result JSON;
BEGIN
  -- Insérer la dépense directement
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
    p_group_id,
    p_description,
    p_amount,
    p_category_id,
    p_paid_by,
    p_currency::app.currency_type,
    p_split_type::app.expense_split_type,
    p_created_by,
    CURRENT_DATE
  )
  RETURNING id INTO v_expense_id;

  -- Retourner le résultat
  v_result := json_build_object(
    'id', v_expense_id,
    'success', true,
    'message', 'Dépense "' || p_description || '" ajoutée avec succès !',
    'amount', p_amount,
    'currency', p_currency
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retourner l'erreur détaillée
    v_result := json_build_object(
      'success', false,
      'error_code', SQLSTATE,
      'error_message', SQLERRM,
      'error_detail', SQLSTATE || ': ' || SQLERRM
    );
    RETURN v_result;
END;
$$;
