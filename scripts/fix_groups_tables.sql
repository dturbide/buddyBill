-- Script pour corriger les problèmes avec les tables de groupes

-- 1. Vérifier dans quels schémas se trouvent les tables
SELECT 'Vérification des tables groups dans tous les schémas:' as info;
SELECT 
    n.nspname as schema,
    c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'groups'
ORDER BY n.nspname;

-- 2. Désactiver temporairement RLS sur les tables de groupes (public et app)
ALTER TABLE IF EXISTS public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.group_members DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporairement désactivé sur les tables groups et group_members' as info;

-- 3. Vérifier si les tables existent dans le schéma public
SELECT 'Tables dans le schéma public:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members');

-- 4. Vérifier si les tables existent dans le schéma app
SELECT 'Tables dans le schéma app:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name IN ('groups', 'group_members');

-- 5. Créer les tables manquantes dans le schéma public si nécessaire
DO $$
BEGIN
    -- Vérifier si la table groups existe dans le schéma public
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups') THEN
        CREATE TABLE public.groups (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            currency TEXT DEFAULT 'USD',
            created_by UUID NOT NULL REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        RAISE NOTICE 'Table public.groups créée';
    END IF;

    -- Vérifier si la table group_members existe dans le schéma public
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members') THEN
        -- Vérifier si le type group_member_role existe
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role') THEN
            CREATE TYPE group_member_role AS ENUM ('admin', 'member');
            RAISE NOTICE 'Type group_member_role créé';
        END IF;
        
        CREATE TABLE public.group_members (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role group_member_role NOT NULL DEFAULT 'member',
            invited_by UUID NOT NULL REFERENCES auth.users(id),
            joined_at TIMESTAMPTZ DEFAULT now(),
            accepted_at TIMESTAMPTZ,
            UNIQUE(group_id, user_id)
        );
        
        RAISE NOTICE 'Table public.group_members créée';
    END IF;
END $$;

-- 6. Créer des politiques RLS simples et fonctionnelles
DO $$
BEGIN
    -- Supprimer les politiques existantes qui pourraient causer des problèmes
    DROP POLICY IF EXISTS groups_insert_policy ON public.groups;
    DROP POLICY IF EXISTS groups_select_policy ON public.groups;
    DROP POLICY IF EXISTS group_members_insert_policy ON public.group_members;
    DROP POLICY IF EXISTS group_members_select_policy ON public.group_members;
    
    -- Créer des politiques simples pour les groupes
    CREATE POLICY groups_insert_policy ON public.groups
        FOR INSERT TO authenticated
        WITH CHECK (true);  -- Permettre à tous les utilisateurs authentifiés d'insérer
    
    CREATE POLICY groups_select_policy ON public.groups
        FOR SELECT TO authenticated
        USING (true);  -- Permettre à tous les utilisateurs authentifiés de voir tous les groupes
    
    -- Créer des politiques simples pour les membres de groupes
    CREATE POLICY group_members_insert_policy ON public.group_members
        FOR INSERT TO authenticated
        WITH CHECK (true);  -- Permettre à tous les utilisateurs authentifiés d'insérer
    
    CREATE POLICY group_members_select_policy ON public.group_members
        FOR SELECT TO authenticated
        USING (true);  -- Permettre à tous les utilisateurs authentifiés de voir tous les membres
    
    RAISE NOTICE 'Politiques RLS simples créées';
END $$;

-- 7. Réactiver RLS avec les nouvelles politiques simples
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_members ENABLE ROW LEVEL SECURITY;

SELECT 'RLS réactivé avec des politiques simples' as info;

-- 8. Vérifier les politiques RLS actuelles
SELECT 'Politiques RLS actuelles:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname IN ('public', 'app')
AND tablename IN ('groups', 'group_members')
ORDER BY schemaname, tablename, policyname;

-- 9. Tester l'insertion d'un groupe
SELECT 'Test d''insertion d''un groupe:' as info;
INSERT INTO public.groups (
    name,
    description,
    currency,
    created_by
) VALUES (
    'Groupe Test Script',
    'Groupe créé par le script de correction',
    'EUR',
    auth.uid()
)
RETURNING *;

-- 10. Tester l'insertion d'un membre
SELECT 'Test d''insertion d''un membre:' as info;
INSERT INTO public.group_members (
    group_id,
    user_id,
    role,
    invited_by,
    accepted_at
)
SELECT 
    id,
    created_by,
    'admin',
    created_by,
    now()
FROM public.groups
WHERE name = 'Groupe Test Script'
RETURNING *;
