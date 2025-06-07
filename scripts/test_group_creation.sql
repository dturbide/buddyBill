-- Script pour tester la création d'un groupe directement dans SQL

-- 1. D'abord, vérifier quel est l'utilisateur actuel
SELECT 
    'Utilisateur actuel:' as info,
    auth.uid() as user_id,
    auth.role() as role,
    auth.email() as email;

-- 2. Tester l'insertion d'un groupe de test
-- Note: Remplacez auth.uid() par un UUID valide si nécessaire
INSERT INTO public.groups (
    name,
    description,
    currency,
    created_by
) VALUES (
    'Groupe Test SQL',
    'Groupe créé directement depuis SQL pour tester',
    'EUR',
    auth.uid()
)
RETURNING *;

-- 3. Insérer l'utilisateur comme membre admin du groupe
-- Note: Ceci devrait normalement être fait automatiquement par l'API
INSERT INTO public.group_members (
    group_id,
    user_id,
    role,
    invited_by
) 
SELECT 
    g.id,
    auth.uid(),
    'admin',
    auth.uid()
FROM public.groups g
WHERE g.name = 'Groupe Test SQL'
AND g.created_by = auth.uid()
ORDER BY g.created_at DESC
LIMIT 1
RETURNING *;

-- 4. Vérifier que le groupe et le membre ont été créés
SELECT 
    'Groupes après insertion:' as info,
    g.*,
    gm.role as user_role
FROM public.groups g
LEFT JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = auth.uid()
WHERE g.created_by = auth.uid()
ORDER BY g.created_at DESC;
