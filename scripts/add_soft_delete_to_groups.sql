-- Ajouter les colonnes pour le soft delete
ALTER TABLE public.groups 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN recover_until TIMESTAMP WITH TIME ZONE;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_groups_deleted_at ON public.groups(deleted_at);
CREATE INDEX idx_groups_recover_until ON public.groups(recover_until);

-- Commentaires pour documentation
COMMENT ON COLUMN public.groups.deleted_at IS 'Date de suppression du groupe (soft delete)';
COMMENT ON COLUMN public.groups.recover_until IS 'Date limite de récupération (30 jours après suppression)';
