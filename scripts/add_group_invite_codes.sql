-- =====================================================
-- AJOUT DU SYSTÈME DE CODES D'INVITATION POUR LES GROUPES
-- À exécuter dans Supabase SQL Editor après deploy_expense_tables.sql
-- =====================================================

-- 1. Ajouter la colonne invite_code à la table groups
ALTER TABLE app.groups 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 2. Créer un index pour les performances sur invite_code
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON app.groups(invite_code);

-- 3. Fonction pour générer un code d'invitation sécurisé
CREATE OR REPLACE FUNCTION app.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN := TRUE;
BEGIN
    -- Générer un code unique de 12 caractères
    WHILE code_exists LOOP
        result := '';
        FOR i IN 1..12 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM app.groups WHERE invite_code = result) INTO code_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger pour générer automatiquement un code d'invitation lors de la création d'un groupe
CREATE OR REPLACE FUNCTION app.set_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := app.generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS set_group_invite_code_trigger ON app.groups;

-- Créer le trigger
CREATE TRIGGER set_group_invite_code_trigger
    BEFORE INSERT ON app.groups
    FOR EACH ROW
    EXECUTE FUNCTION app.set_group_invite_code();

-- 5. Générer des codes pour les groupes existants qui n'en ont pas
UPDATE app.groups 
SET invite_code = app.generate_invite_code() 
WHERE invite_code IS NULL;

-- 6. Fonction pour rejoindre un groupe via code d'invitation
CREATE OR REPLACE FUNCTION app.join_group_by_code(p_invite_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_group_id UUID;
    v_group_name TEXT;
    v_user_id UUID := auth.uid();
    v_already_member BOOLEAN;
BEGIN
    -- Vérifier que l'utilisateur est connecté
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Utilisateur non connecté');
    END IF;
    
    -- Trouver le groupe avec ce code
    SELECT id, name INTO v_group_id, v_group_name
    FROM app.groups 
    WHERE invite_code = UPPER(p_invite_code) 
    AND archived_at IS NULL;
    
    IF v_group_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Code d''invitation invalide');
    END IF;
    
    -- Vérifier si l'utilisateur est déjà membre
    SELECT EXISTS(
        SELECT 1 FROM app.group_members 
        WHERE group_id = v_group_id 
        AND user_id = v_user_id 
        AND left_at IS NULL
    ) INTO v_already_member;
    
    IF v_already_member THEN
        RETURN json_build_object('success', false, 'error', 'Vous êtes déjà membre de ce groupe');
    END IF;
    
    -- Ajouter l'utilisateur au groupe
    INSERT INTO app.group_members (group_id, user_id, role, invitation_status)
    VALUES (v_group_id, v_user_id, 'member', 'accepted');
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Vous avez rejoint le groupe avec succès',
        'group_id', v_group_id,
        'group_name', v_group_name
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Erreur lors de l''ajout au groupe');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Permissions
GRANT EXECUTE ON FUNCTION app.generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION app.join_group_by_code(TEXT) TO authenticated;

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Système de codes d''invitation ajouté avec succès!';
END $$;
