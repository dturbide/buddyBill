-- Script pour diagnostiquer les problèmes de membership
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier tous les groupes existants
SELECT 
    id, 
    name, 
    created_by, 
    invite_code,
    created_at
FROM public.groups 
ORDER BY created_at DESC;

-- 2. Vérifier tous les memberships
SELECT 
    gm.id,
    gm.group_id,
    gm.user_id,
    gm.role,
    gm.created_at,
    gm.left_at,
    g.name as group_name,
    au.email
FROM public.group_members gm
LEFT JOIN public.groups g ON gm.group_id = g.id
LEFT JOIN auth.users au ON gm.user_id = au.id
ORDER BY gm.created_at DESC;

-- 3. Identifier les groupes sans membres (créateur non ajouté)
SELECT 
    g.id,
    g.name,
    g.created_by,
    au.email as creator_email,
    COUNT(gm.id) as member_count
FROM public.groups g
LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.left_at IS NULL
LEFT JOIN auth.users au ON g.created_by = au.id
GROUP BY g.id, g.name, g.created_by, au.email
HAVING COUNT(gm.id) = 0;

-- 4. Ajouter le créateur comme admin pour les groupes orphelins
INSERT INTO public.group_members (group_id, user_id, role)
SELECT 
    g.id,
    g.created_by,
    'admin'
FROM public.groups g
LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.user_id = g.created_by AND gm.left_at IS NULL
WHERE gm.id IS NULL;

-- 5. Vérifier le résultat final
SELECT 
    g.id,
    g.name,
    g.created_by,
    au.email as creator_email,
    COUNT(gm.id) as member_count
FROM public.groups g
LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.left_at IS NULL
LEFT JOIN auth.users au ON g.created_by = au.id
GROUP BY g.id, g.name, g.created_by, au.email
ORDER BY g.created_at DESC;
