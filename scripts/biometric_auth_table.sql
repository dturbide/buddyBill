-- Table pour stocker les credentials biométriques
CREATE TABLE IF NOT EXISTS public.biometric_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON public.biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id ON public.biometric_credentials(credential_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_biometric_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_biometric_credentials_updated_at ON public.biometric_credentials;
CREATE TRIGGER update_biometric_credentials_updated_at
    BEFORE UPDATE ON public.biometric_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_biometric_credentials_updated_at();

-- Politiques RLS (Row Level Security)
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent seulement voir et gérer leurs propres credentials
CREATE POLICY "Utilisateurs peuvent voir leurs credentials" ON public.biometric_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs credentials" ON public.biometric_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs credentials" ON public.biometric_credentials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs credentials" ON public.biometric_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour last_used_at lors de l'authentification
CREATE OR REPLACE FUNCTION update_credential_last_used(credential_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.biometric_credentials 
    SET last_used_at = NOW()
    WHERE credential_id = credential_id_param 
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT ALL ON public.biometric_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION update_credential_last_used(TEXT) TO authenticated;

-- Commentaires pour documentation
COMMENT ON TABLE public.biometric_credentials IS 'Stockage des credentials biométriques WebAuthn pour l''authentification';
COMMENT ON COLUMN public.biometric_credentials.credential_id IS 'ID unique du credential WebAuthn (base64)';
COMMENT ON COLUMN public.biometric_credentials.public_key IS 'Clé publique du credential (base64)';
COMMENT ON COLUMN public.biometric_credentials.counter IS 'Compteur d''utilisation pour prévenir les attaques replay';
COMMENT ON COLUMN public.biometric_credentials.device_name IS 'Nom du type d''appareil/biométrie (Face ID, Touch ID, etc.)';
COMMENT ON COLUMN public.biometric_credentials.last_used_at IS 'Dernière utilisation de ce credential';
