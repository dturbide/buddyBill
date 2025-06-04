-- =====================================================
-- EXPENSE SHARING APP - CONFIGURATION STORAGE
-- Script 007: Configuration du stockage Supabase
-- =====================================================

-- 1. Buckets pour le stockage des fichiers

-- Bucket pour les images de profil des utilisateurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    1048576, -- 1MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les images des groupes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'group-images',
    'group-images',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les reçus et justificatifs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    false, -- Privé pour sécurité
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Politiques de stockage

-- Politique pour les avatars - Lecture publique
CREATE POLICY "Avatars are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Politique pour les avatars - Upload par l'utilisateur propriétaire
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() = (SPLIT_PART(name, '/', 1))::UUID
);

-- Politique pour les avatars - Mise à jour par l'utilisateur propriétaire
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' AND 
    auth.uid() = (SPLIT_PART(name, '/', 1))::UUID
);

-- Politique pour les avatars - Suppression par l'utilisateur propriétaire
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'avatars' AND 
    auth.uid() = (SPLIT_PART(name, '/', 1))::UUID
);

-- Politique pour les images de groupe - Lecture publique
CREATE POLICY "Group images are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'group-images');

-- Politique pour les images de groupe - Upload par les admins
CREATE POLICY "Group admins can upload group images" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'group-images' AND 
    EXISTS (
        SELECT 1 FROM app.group_members
        WHERE group_id = (SPLIT_PART(name, '/', 1))::UUID
          AND user_id = auth.uid()
          AND role = 'admin'
          AND left_at IS NULL
    )
);

-- Politique pour les images de groupe - Mise à jour par les admins
CREATE POLICY "Group admins can update group images" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'group-images' AND 
    EXISTS (
        SELECT 1 FROM app.group_members
        WHERE group_id = (SPLIT_PART(name, '/', 1))::UUID
          AND user_id = auth.uid()
          AND role = 'admin'
          AND left_at IS NULL
    )
);

-- Politique pour les images de groupe - Suppression par les admins
CREATE POLICY "Group admins can delete group images" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'group-images' AND 
    EXISTS (
        SELECT 1 FROM app.group_members
        WHERE group_id = (SPLIT_PART(name, '/', 1))::UUID
          AND user_id = auth.uid()
          AND role = 'admin'
          AND left_at IS NULL
    )
);

-- Politique pour les reçus - Lecture par les membres du groupe
CREATE POLICY "Group members can view receipts" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'receipts' AND 
    EXISTS (
        SELECT 1 
        FROM app.expenses e
        JOIN app.group_members gm ON gm.group_id = e.group_id
        WHERE e.id = (SPLIT_PART(name, '/', 1))::UUID
          AND gm.user_id = auth.uid()
          AND gm.left_at IS NULL
    )
);

-- Politique pour les reçus - Upload par le créateur de la dépense
CREATE POLICY "Expense creators can upload receipts" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'receipts' AND 
    EXISTS (
        SELECT 1 FROM app.expenses
        WHERE id = (SPLIT_PART(name, '/', 1))::UUID
          AND created_by = auth.uid()
    )
);

-- Politique pour les reçus - Mise à jour par le créateur
CREATE POLICY "Expense creators can update receipts" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'receipts' AND 
    EXISTS (
        SELECT 1 FROM app.expenses
        WHERE id = (SPLIT_PART(name, '/', 1))::UUID
          AND created_by = auth.uid()
    )
);

-- Politique pour les reçus - Suppression par le créateur ou admin du groupe
CREATE POLICY "Expense creators and group admins can delete receipts" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'receipts' AND 
    EXISTS (
        SELECT 1 
        FROM app.expenses e
        LEFT JOIN app.group_members gm ON gm.group_id = e.group_id AND gm.user_id = auth.uid()
        WHERE e.id = (SPLIT_PART(name, '/', 1))::UUID
          AND (
            e.created_by = auth.uid() 
            OR (gm.role = 'admin' AND gm.left_at IS NULL)
          )
    )
);

-- 3. Fonctions helper pour les URLs de stockage

-- Fonction pour obtenir l'URL publique d'un avatar
CREATE OR REPLACE FUNCTION app.get_avatar_url(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_path TEXT;
BEGIN
    v_path := p_user_id || '/avatar';
    
    -- Vérifier si le fichier existe
    IF EXISTS (
        SELECT 1 FROM storage.objects
        WHERE bucket_id = 'avatars'
          AND name LIKE v_path || '%'
    ) THEN
        RETURN 'https://' || current_setting('app.settings.supabase_url', true) || 
               '/storage/v1/object/public/avatars/' || v_path;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'URL publique d'une image de groupe
CREATE OR REPLACE FUNCTION app.get_group_image_url(p_group_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_path TEXT;
BEGIN
    v_path := p_group_id || '/image';
    
    -- Vérifier si le fichier existe
    IF EXISTS (
        SELECT 1 FROM storage.objects
        WHERE bucket_id = 'group-images'
          AND name LIKE v_path || '%'
    ) THEN
        RETURN 'https://' || current_setting('app.settings.supabase_url', true) || 
               '/storage/v1/object/public/group-images/' || v_path;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'URL signée d'un reçu (accès temporaire)
CREATE OR REPLACE FUNCTION app.get_receipt_url(p_expense_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_path TEXT;
    v_file_name TEXT;
BEGIN
    -- Vérifier que l'utilisateur a accès à cette dépense
    IF NOT EXISTS (
        SELECT 1 
        FROM app.expenses e
        JOIN app.group_members gm ON gm.group_id = e.group_id
        WHERE e.id = p_expense_id
          AND gm.user_id = auth.uid()
          AND gm.left_at IS NULL
    ) THEN
        RETURN NULL;
    END IF;
    
    v_path := p_expense_id || '/';
    
    -- Récupérer le nom du fichier
    SELECT name INTO v_file_name
    FROM storage.objects
    WHERE bucket_id = 'receipts'
      AND name LIKE v_path || '%'
    LIMIT 1;
    
    IF v_file_name IS NOT NULL THEN
        -- Générer une URL signée valide 1 heure
        RETURN storage.create_signed_url('receipts', v_file_name, 3600);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers pour mettre à jour automatiquement les URLs

-- Trigger pour mettre à jour l'avatar_url dans user_profiles
CREATE OR REPLACE FUNCTION app.update_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bucket_id = 'avatars' THEN
        UPDATE public.user_profiles
        SET avatar_url = app.get_avatar_url((SPLIT_PART(NEW.name, '/', 1))::UUID)
        WHERE id = (SPLIT_PART(NEW.name, '/', 1))::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_avatar_upload
    AFTER INSERT OR UPDATE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION app.update_avatar_url();

-- Trigger pour mettre à jour l'image_url dans groups
CREATE OR REPLACE FUNCTION app.update_group_image_url()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bucket_id = 'group-images' THEN
        UPDATE app.groups
        SET image_url = app.get_group_image_url((SPLIT_PART(NEW.name, '/', 1))::UUID)
        WHERE id = (SPLIT_PART(NEW.name, '/', 1))::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_image_upload
    AFTER INSERT OR UPDATE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION app.update_group_image_url();

-- Trigger pour mettre à jour receipt_url dans expenses
CREATE OR REPLACE FUNCTION app.update_receipt_url()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bucket_id = 'receipts' THEN
        UPDATE app.expenses
        SET receipt_url = 'receipts/' || NEW.name
        WHERE id = (SPLIT_PART(NEW.name, '/', 1))::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_receipt_upload
    AFTER INSERT OR UPDATE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION app.update_receipt_url();

-- 5. Permissions
GRANT EXECUTE ON FUNCTION app.get_avatar_url TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_group_image_url TO authenticated;
GRANT EXECUTE ON FUNCTION app.get_receipt_url TO authenticated;
