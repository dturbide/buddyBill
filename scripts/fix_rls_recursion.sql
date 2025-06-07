-- =====================================================
-- CORRECTION DES POLITIQUES RLS RÉCURSIVES
-- À exécuter immédiatement pour corriger l'erreur de récursion infinie
-- =====================================================

-- Supprimer les politiques problématiques et les recréer sans récursion
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Politique pour voir les membres (sans récursion)
CREATE POLICY "Users can view group members for their groups"
  ON public.group_members FOR SELECT
  USING (
    -- L'utilisateur peut voir les membres des groupes où il est membre
    user_id = auth.uid() OR
    group_id IN (
      SELECT g.id FROM public.groups g
      WHERE g.created_by = auth.uid()
    )
  );

-- Politique pour gérer les membres (sans récursion)
CREATE POLICY "Group admins can manage group members"
  ON public.group_members FOR ALL
  USING (
    -- Seuls les créateurs de groupe peuvent gérer tous les membres
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    ) OR
    -- Ou l'utilisateur peut gérer ses propres données
    user_id = auth.uid()
  );

-- Politique pour rejoindre un groupe (simplifiée)
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Politiques RLS corrigées avec succès!';
    RAISE NOTICE 'Plus de récursion infinie sur group_members';
END $$;
