-- Script pour diagnostiquer les groupes d'un utilisateur
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les utilisateurs dans auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%denturbide%' OR email LIKE '%deniturbide%'
ORDER BY created_at;

-- 2. Vérifier tous les groupes existants
SELECT id, name, created_by, created_at
FROM public.groups
ORDER BY created_at;

-- 3. Vérifier les memberships de groupe
SELECT 
    gm.user_id,
    gm.group_id,
    gm.left_at,
    u.email,
    g.name as group_name
FROM public.group_members gm
LEFT JOIN auth.users u ON gm.user_id = u.id
LEFT JOIN public.groups g ON gm.group_id = g.id
ORDER BY gm.created_at;

-- 4. Rechercher spécifiquement pour denturbide@gmail.com
SELECT 
    gm.*,
    g.name as group_name
FROM public.group_members gm
LEFT JOIN public.groups g ON gm.group_id = g.id
WHERE gm.user_id IN (
    SELECT id FROM auth.users WHERE email = 'denturbide@gmail.com'
);
