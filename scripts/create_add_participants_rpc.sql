-- Fonction RPC pour ajouter des participants avec bypass RLS
CREATE OR REPLACE FUNCTION create_expense_participants(
  p_expense_id UUID,
  p_participants JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant JSONB;
  inserted_count INTEGER := 0;
  participant_record RECORD;
BEGIN
  -- Boucle pour insérer chaque participant
  FOR participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    INSERT INTO app.expense_participants (
      expense_id,
      user_id,
      share_amount,
      is_settled
    ) VALUES (
      p_expense_id,
      (participant->>'user_id')::UUID,
      (participant->>'share_amount')::NUMERIC,
      (participant->>'is_settled')::BOOLEAN
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Participants ajoutés avec succès',
    'participants_count', inserted_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_message', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;
