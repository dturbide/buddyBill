-- =====================================================
-- AJOUT DU SYSTÈME DE CODES D'INVITATION POUR LES GROUPES
-- À exécuter dans Supabase SQL Editor
-- Adapté pour le schéma PUBLIC (groups dans public, autres fonctionnalités dans app)
-- =====================================================

-- 1. Ajouter la colonne invite_code à la table public.groups
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 2. Créer un index pour les performances sur invite_code
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);

-- 3. Fonction pour générer un code d'invitation sécurisé
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN := TRUE;
BEGIN
    -- Générer un code jusqu'à ce qu'il soit unique
    WHILE code_exists LOOP
        result := '';
        
        -- Générer un code de 12 caractères
        FOR i IN 1..12 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = result) INTO code_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour générer automatiquement un code d'invitation lors de la création d'un groupe
CREATE OR REPLACE FUNCTION public.set_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := public.generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS set_group_invite_code_trigger ON public.groups;

-- Créer le trigger
CREATE TRIGGER set_group_invite_code_trigger
    BEFORE INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_group_invite_code();

-- 5. Fonction pour rejoindre un groupe via code d'invitation
CREATE OR REPLACE FUNCTION public.join_group_by_code(p_invite_code TEXT)
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
    FROM public.groups 
    WHERE invite_code = UPPER(p_invite_code) 
    AND archived_at IS NULL;
    
    IF v_group_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Code d''invitation invalide');
    END IF;
    
    -- Vérifier si l'utilisateur est déjà membre
    SELECT EXISTS(
        SELECT 1 FROM public.group_members 
        WHERE group_id = v_group_id 
        AND user_id = v_user_id 
        AND left_at IS NULL
    ) INTO v_already_member;
    
    IF v_already_member THEN
        RETURN json_build_object('success', false, 'error', 'Vous êtes déjà membre de ce groupe');
    END IF;
    
    -- Ajouter l'utilisateur au groupe
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, v_user_id, 'member');
    
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

-- 6. Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated;

-- 7. Générer des codes d'invitation pour les groupes existants qui n'en ont pas
UPDATE public.groups 
SET invite_code = public.generate_invite_code() 
WHERE invite_code IS NULL;

-- 8. Politique RLS pour les codes d'invitation (si RLS est activé)
-- Les utilisateurs peuvent voir les codes des groupes dont ils sont membres
DROP POLICY IF EXISTS "Users can view invite codes of their groups" ON public.groups;
CREATE POLICY "Users can view invite codes of their groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = groups.id 
      AND gm.user_id = auth.uid() 
      AND gm.left_at IS NULL
    )
  );

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Système de codes d''invitation ajouté avec succès aux groupes du schéma public!';
    RAISE NOTICE 'Les fonctions sont disponibles : public.generate_invite_code() et public.join_group_by_code()';
END $$;
