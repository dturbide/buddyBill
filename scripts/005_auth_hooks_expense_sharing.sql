-- =====================================================
-- EXPENSE SHARING APP - HOOKS D'AUTHENTIFICATION
-- Script 005: Gestion de l'authentification et hooks
-- =====================================================

-- 1. Fonction pour gérer la création automatique du profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. Fonction pour nettoyer les données lors de la suppression d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Marquer l'utilisateur comme ayant quitté tous ses groupes
    UPDATE app.group_members
    SET left_at = NOW()
    WHERE user_id = OLD.id
      AND left_at IS NULL;
    
    -- Transférer la propriété des groupes créés au prochain admin
    UPDATE app.groups g
    SET created_by = (
        SELECT gm.user_id
        FROM app.group_members gm
        WHERE gm.group_id = g.id
          AND gm.role = 'admin'
          AND gm.user_id != OLD.id
          AND gm.left_at IS NULL
        LIMIT 1
    )
    WHERE created_by = OLD.id;
    
    -- Archiver les groupes sans admin restant
    UPDATE app.groups
    SET archived_at = NOW()
    WHERE id IN (
        SELECT g.id
        FROM app.groups g
        WHERE NOT EXISTS (
            SELECT 1
            FROM app.group_members gm
            WHERE gm.group_id = g.id
              AND gm.role = 'admin'
              AND gm.left_at IS NULL
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nettoyer lors de la suppression
CREATE TRIGGER on_user_deleted
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deletion();

-- 3. Fonction pour valider les emails lors de l'inscription
CREATE OR REPLACE FUNCTION public.validate_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier que l'email est valide
    IF NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour gérer les invitations par email
CREATE OR REPLACE FUNCTION app.process_pending_invitations(p_user_email TEXT)
RETURNS VOID AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO v_user_id
    FROM public.user_profiles
    WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Traiter toutes les invitations en attente pour cet email
    FOR v_invitation IN 
        SELECT * FROM app.group_invitations
        WHERE email = p_user_email
          AND status = 'pending'
          AND expires_at > NOW()
    LOOP
        -- Ajouter automatiquement l'utilisateur au groupe
        INSERT INTO app.group_members (group_id, user_id, invited_by)
        VALUES (v_invitation.group_id, v_user_id, v_invitation.invited_by)
        ON CONFLICT (group_id, user_id) DO NOTHING;
        
        -- Mettre à jour le statut de l'invitation
        UPDATE app.group_invitations
        SET status = 'accepted'
        WHERE id = v_invitation.id;
        
        -- Logger l'activité
        PERFORM app.log_activity(
            v_user_id,
            'member_joined'::app.activity_type,
            v_invitation.group_id,
            'member',
            NULL,
            jsonb_build_object(
                'invitation_id', v_invitation.id,
                'auto_accepted', true
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour obtenir le contexte utilisateur complet
CREATE OR REPLACE FUNCTION app.get_user_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_context JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'preferred_currency', u.preferred_currency,
            'notification_settings', u.notification_settings
        ),
        'groups', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', g.id,
                    'name', g.name,
                    'type', g.type,
                    'image_url', g.image_url,
                    'default_currency', g.default_currency,
                    'role', gm.role,
                    'member_count', (
                        SELECT COUNT(*)
                        FROM app.group_members gm2
                        WHERE gm2.group_id = g.id AND gm2.left_at IS NULL
                    )
                )
            )
            FROM app.groups g
            JOIN app.group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = p_user_id
              AND gm.left_at IS NULL
        ),
        'summary', (
            SELECT row_to_json(s.*)
            FROM app.get_user_summary(p_user_id) s
        ),
        'recent_activities', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'type', a.activity_type,
                    'description', a.description,
                    'amount', a.amount,
                    'group_name', a.group_name,
                    'created_at', a.created_at
                )
            )
            FROM app.get_recent_activities(p_user_id, 5) a
        )
    ) INTO v_context
    FROM public.user_profiles u
    WHERE u.id = p_user_id;
    
    RETURN v_context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour vérifier les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION app.check_user_permission(
    p_user_id UUID,
    p_group_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role app.group_member_role;
BEGIN
    -- Récupérer le rôle de l'utilisateur dans le groupe
    SELECT role INTO v_role
    FROM app.group_members
    WHERE user_id = p_user_id
      AND group_id = p_group_id
      AND left_at IS NULL;
    
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier les permissions selon le rôle
    CASE p_permission
        WHEN 'view' THEN
            RETURN TRUE; -- Tous les membres peuvent voir
        WHEN 'create_expense' THEN
            RETURN v_role IN ('admin', 'member');
        WHEN 'edit_expense' THEN
            RETURN v_role = 'admin';
        WHEN 'delete_expense' THEN
            RETURN v_role = 'admin';
        WHEN 'manage_members' THEN
            RETURN v_role = 'admin';
        WHEN 'edit_group' THEN
            RETURN v_role = 'admin';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour l'authentification JWT personnalisée
CREATE OR REPLACE FUNCTION app.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
    claims jsonb;
    user_role TEXT;
BEGIN
    claims := event->'claims';
    
    -- Ajouter des claims personnalisés si nécessaire
    -- Par exemple, ajouter le nombre de groupes de l'utilisateur
    claims := jsonb_set(
        claims,
        '{group_count}',
        to_jsonb((
            SELECT COUNT(*)
            FROM app.group_members
            WHERE user_id = (event->>'user_id')::UUID
              AND left_at IS NULL
        ))
    );
    
    -- Retourner l'événement modifié
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql;

-- 8. Sécurité et permissions
GRANT EXECUTE ON FUNCTION app.process_pending_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_user_context TO authenticated;
GRANT EXECUTE ON FUNCTION app.check_user_permission TO authenticated;

-- 9. Politiques RLS pour les fonctions sensibles
ALTER FUNCTION app.get_user_context SECURITY DEFINER;
ALTER FUNCTION app.process_pending_invitations SECURITY DEFINER;
