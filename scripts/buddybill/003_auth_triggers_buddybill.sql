-- =====================================================
-- BUDDYBILL - TRIGGERS D'AUTHENTIFICATION
-- Script 003: Gestion automatique des utilisateurs
-- =====================================================

-- 1. Fonction pour créer automatiquement un profil utilisateur après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Pour la démo, on crée un tenant par défaut si l'utilisateur n'a pas de tenant_id
  IF NEW.raw_user_meta_data->>'tenant_id' IS NULL THEN
    -- Créer un nouveau tenant pour cet utilisateur
    INSERT INTO public.tenants (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email))
    RETURNING id INTO default_tenant_id;
  ELSE
    default_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  END IF;

  -- Créer le profil utilisateur
  INSERT INTO public.user_profiles (
    id,
    tenant_id,
    full_name,
    email,
    role
  ) VALUES (
    NEW.id,
    default_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'tenant_admin')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger sur la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fonction pour mettre à jour les claims JWT avec tenant_id et role
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_profile RECORD;
BEGIN
  -- Récupérer le profil de l'utilisateur
  SELECT tenant_id, role::text as role
  INTO user_profile
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Si l'utilisateur a un profil, ajouter les claims
  IF user_profile.tenant_id IS NOT NULL THEN
    claims := event->'claims';
    
    -- Ajouter tenant_id et role aux claims
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_profile.tenant_id));
    claims := jsonb_set(claims, '{role}', to_jsonb(user_profile.role));
    
    -- Mettre à jour l'event avec les nouveaux claims
    event := jsonb_set(event, '{claims}', claims);
  END IF;

  RETURN event;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour nettoyer lors de la suppression d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Les suppressions en cascade sont gérées par les contraintes FK
  -- Cette fonction peut être étendue si nécessaire
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger pour la suppression
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- 6. Fonction utilitaire pour créer un utilisateur avec tenant
CREATE OR REPLACE FUNCTION public.create_user_with_tenant(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_company_name TEXT,
  p_role public.user_role DEFAULT 'tenant_admin'
)
RETURNS jsonb AS $$
DECLARE
  new_tenant_id UUID;
  new_user_id UUID;
BEGIN
  -- Créer le tenant
  INSERT INTO public.tenants (name)
  VALUES (p_company_name)
  RETURNING id INTO new_tenant_id;

  -- L'utilisateur sera créé via Supabase Auth
  -- Le trigger handle_new_user créera automatiquement le profil
  
  RETURN jsonb_build_object(
    'tenant_id', new_tenant_id,
    'message', 'Tenant created. User should be created via Supabase Auth.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour inviter un utilisateur dans un tenant
CREATE OR REPLACE FUNCTION public.invite_user_to_tenant(
  p_email TEXT,
  p_tenant_id UUID,
  p_role public.user_role DEFAULT 'employee'
)
RETURNS jsonb AS $$
DECLARE
  invitation_token TEXT;
BEGIN
  -- Vérifier que l'utilisateur actuel est admin du tenant
  IF public.get_user_role() != 'tenant_admin' OR public.get_tenant_id() != p_tenant_id THEN
    RAISE EXCEPTION 'Unauthorized: Only tenant admin can invite users';
  END IF;

  -- Générer un token d'invitation
  invitation_token := encode(gen_random_bytes(32), 'hex');

  -- Stocker l'invitation (nécessite une table invitations)
  -- Pour l'instant, on retourne juste les infos
  
  RETURN jsonb_build_object(
    'email', p_email,
    'tenant_id', p_tenant_id,
    'role', p_role,
    'invitation_token', invitation_token,
    'message', 'Invitation ready to be sent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
