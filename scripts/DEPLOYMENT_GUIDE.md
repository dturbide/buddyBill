# Guide de déploiement des scripts Supabase

## Vue d'ensemble

Ce guide explique comment déployer les scripts SQL pour l'application de partage de dépenses dans Supabase.

## Ordre d'exécution des scripts

Il est **TRÈS IMPORTANT** d'exécuter les scripts dans l'ordre suivant :

1. **001_schema_expense_sharing.sql** - Crée le schéma, les tables et les types ENUM
2. **002_functions_expense_sharing.sql** - Crée les fonctions métier
3. **003_rls_policies_expense_sharing.sql** - Active RLS et crée les politiques de sécurité
4. **004_triggers_views_expense_sharing.sql** - Crée les triggers et vues
5. **005_auth_hooks_expense_sharing.sql** - Configure les hooks d'authentification
6. **006_api_helpers_expense_sharing.sql** - Crée les fonctions helper pour l'API
7. **007_storage_expense_sharing.sql** - Configure les buckets de stockage
8. **009_add_avatar_column.sql** - (IMPORTANT si erreur avatar) Ajoute la colonne avatar_url si manquante
9. **008_fix_avatar_columns.sql** - (OPTIONNEL) Restaure les vues avec avatar_url

## Instructions de déploiement

### Méthode 1 : Déploiement manuel (recommandée)

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Pour chaque script (dans l'ordre) :
   - Copiez le contenu du fichier
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **Run**
   - Vérifiez qu'il n'y a pas d'erreurs

### Méthode 2 : Déploiement automatique

1. Copiez le contenu du fichier `000_deploy_all.sql`
2. Dans Supabase SQL Editor, exécutez-le
3. **Note**: Cette méthode peut ne pas fonctionner si les imports de fichiers ne sont pas supportés

## Résolution des problèmes

### Erreur "column avatar_url does not exist"

Cette erreur indique que la colonne `avatar_url` n'existe pas dans la table `user_profiles`. Pour résoudre :

1. **Exécutez d'abord le script 009** (`009_add_avatar_column.sql`)
   - Ce script vérifie si la colonne existe
   - L'ajoute si elle est manquante
   - Recrée toutes les vues avec COALESCE pour éviter les erreurs

2. **Vérifiez le résultat** dans les logs Supabase :
   - Message de succès : "Colonne avatar_url ajoutée à la table user_profiles"
   - Ou : "Colonne avatar_url existe déjà dans user_profiles"

3. **Si l'erreur persiste**, vérifiez manuellement :
   ```sql
   -- Vérifier les colonnes de user_profiles
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'user_profiles'
   ORDER BY ordinal_position;
   ```

4. **Alternative** : Si le script 001 n'a pas créé avatar_url, vous pouvez modifier le script 001 pour l'inclure ou simplement utiliser le script 009.

### Erreur de syntaxe dans FOREACH

Cette erreur a été corrigée dans le script 002. Assurez-vous d'utiliser la dernière version du script.

### Erreur "schema app does not exist"

Assurez-vous d'avoir exécuté le script 001 en premier. Ce script crée le schéma `app`.

## Configuration post-déploiement

### 1. Buckets de stockage

Après avoir exécuté le script 007, créez manuellement les buckets dans Supabase Storage :
- `avatars` - Pour les photos de profil
- `group-images` - Pour les images des groupes
- `receipts` - Pour les reçus et justificatifs

### 2. Variables d'environnement

Dans votre application Next.js, configurez :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
```

### 3. Authentification email

Pour activer les invitations par email :
1. Allez dans **Authentication > Email Templates**
2. Configurez un template pour les invitations de groupe
3. Activez l'envoi d'emails dans **Settings > Email**

## Vérification du déploiement

Exécutez cette requête pour vérifier que tout est bien installé :

```sql
-- Vérifier les tables
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'app'
ORDER BY table_name;

-- Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'app'
ORDER BY routine_name;

-- Vérifier que RLS est activé
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'app' 
  AND rowsecurity = true;

-- Vérifier les buckets (dans Supabase Dashboard > Storage)
```

## Tests recommandés

1. **Test d'authentification** : Créez un nouvel utilisateur et vérifiez que le profil est créé automatiquement
2. **Test de création de groupe** : Créez un groupe et vérifiez que le créateur est ajouté comme admin
3. **Test RLS** : Essayez d'accéder aux données d'un autre utilisateur (devrait être bloqué)
4. **Test de stockage** : Uploadez une image de profil et vérifiez qu'elle est accessible

## Support

Pour toute question ou problème, consultez :
- La documentation Supabase : https://supabase.com/docs
- Les logs dans Supabase Dashboard > Logs > Postgres
- Les messages d'erreur détaillés dans SQL Editor
