-- =====================================================
-- RÉPARATION SIMPLE DES POLITIQUES RLS
-- Pour permettre les requêtes de base sans récursion
-- =====================================================

-- 1. Supprimer toutes les politiques problématiques
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- 2. Créer des politiques simples pour groups
CREATE POLICY "Users can view all groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- 3. Créer des politiques simples pour group_members
CREATE POLICY "Users can view all group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert themselves as group members"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
  ON public.group_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Message de succès
DO $$
BEGIN
    RAISE NOTICE 'Politiques RLS simplifiées appliquées avec succès!';
    RAISE NOTICE 'Les requêtes de base devraient maintenant fonctionner.';
END $$;
