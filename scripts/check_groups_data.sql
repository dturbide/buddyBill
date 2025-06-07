-- Script pour vérifier les données dans les tables groups et group_members

-- 1. Vérifier si RLS est activé ou non
SELECT 
    tablename,
    rowsecurity as "RLS activé"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('groups', 'group_members')
ORDER BY tablename;

-- 2. Compter le nombre total de groupes (sans RLS)
SELECT 
    'Nombre total de groupes dans la table:' as info,
    COUNT(*) as count
FROM public.groups;

-- 3. Lister TOUS les groupes (sans restriction RLS)
SELECT 
    'Tous les groupes:' as info,
    id,
    name,
    description,
    created_by,
    created_at,
    currency
FROM public.groups
ORDER BY created_at DESC;

-- 4. Compter les membres par groupe
SELECT 
    'Membres par groupe:' as info,
    g.name as group_name,
    COUNT(gm.*) as member_count
FROM public.groups g
LEFT JOIN public.group_members gm ON g.id = gm.group_id
GROUP BY g.id, g.name
ORDER BY g.created_at DESC;

-- 5. Vérifier l'utilisateur actuellement connecté
SELECT 
    'Utilisateur actuel (auth.uid()):' as info,
    auth.uid() as user_id;

-- 6. Vérifier les groupes visibles pour l'utilisateur actuel (avec RLS)
SELECT 
    'Groupes visibles pour l\'utilisateur actuel:' as info,
    g.*
FROM public.groups g
WHERE EXISTS (
    SELECT 1 
    FROM public.group_members gm
    WHERE gm.group_id = g.id 
    AND gm.user_id = auth.uid()
);

-- 7. Détails de tous les membres de groupes
SELECT 
    'Détails des membres:' as info,
    gm.*,
    g.name as group_name
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id
ORDER BY g.created_at DESC, gm.joined_at DESC;
