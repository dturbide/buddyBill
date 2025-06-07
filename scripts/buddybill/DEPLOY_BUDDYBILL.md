# Guide de déploiement BuddyBill

## Vue d'ensemble

Ce guide explique comment déployer les scripts SQL pour BuddyBill dans Supabase.

## Ordre d'exécution des scripts

**IMPORTANT**: Exécuter les scripts dans cet ordre exact :

1. **001_schema_buddybill.sql** - Crée les tables et types
2. **002_rls_buddybill.sql** - Configure les politiques de sécurité
3. **003_auth_triggers_buddybill.sql** - Configure les triggers d'authentification

## Instructions de déploiement

### 1. Via Supabase Dashboard

1. Connectez-vous à votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez chaque script dans l'ordre

### 2. Via Supabase CLI

```bash
# Se connecter à Supabase
supabase login

# Lier au projet
supabase link --project-ref [votre-project-ref]

# Exécuter les scripts
supabase db push scripts/buddybill/001_schema_buddybill.sql
supabase db push scripts/buddybill/002_rls_buddybill.sql
supabase db push scripts/buddybill/003_auth_triggers_buddybill.sql
```

## Configuration post-déploiement

### 1. Configurer les hooks JWT

Dans Supabase Dashboard :
1. Allez dans Authentication > Hooks
2. Activez "Custom access token hook"
3. Sélectionnez la fonction `custom_access_token_hook`

### 2. Créer le premier superadmin

```sql
-- Créer un utilisateur superadmin manuellement après son inscription
UPDATE public.user_profiles 
SET role = 'superadmin' 
WHERE email = 'admin@example.com';
```

### 3. Variables d'environnement

Assurez-vous que votre `.env.local` contient :
```
NEXT_PUBLIC_SUPABASE_URL=votre-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

## Structure des données

### Hiérarchie
1. **Tenants** : Entreprises clientes de BuddyBill
2. **Users** : Utilisateurs appartenant à un tenant
3. **Customers** : Clients du tenant
4. **Quotes/Jobs/Invoices** : Données métier du tenant

### Rôles
- **superadmin** : Administrateur de la plateforme
- **tenant_admin** : Administrateur d'une entreprise
- **employee** : Employé avec accès complet
- **accountant** : Accès limité à la facturation

## Problème auth.users et solutions

### Erreur commune :
```
ERROR: 42703: column "tenant_id" does not exist
ERROR: 42P01: relation "auth.users" does not exist
```

### Solution implémentée :

**Le script `001_schema_buddybill.sql` a été modifié pour être autonome :**
- Table `user_profiles` utilise maintenant `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Colonne `auth_user_id UUID` optionnelle pour lien futur
- Plus de dépendance vers `auth.users` (qui peut ne pas exister)

**Migration future vers auth.users :**
- Script `001_schema_buddybill_with_auth.sql` créé pour restaurer les liens auth
- À exécuter APRÈS activation de l'authentification Supabase

## Dépannage

### 🚨 **Problème : Erreurs de dépendances avec `tenant_id` et `auth.users`**

#### **Symptômes :**
```
ERROR: 42703: column "tenant_id" does not exist
ERROR: 42P01: relation "auth.users" does not exist
```

#### **Causes possibles :**

**1. Dépendance circulaire avec user_profiles :**
   - ❌ **Ancien problème** : Les tables `quotes`, `jobs`, `invoices` référençaient `user_profiles(id)` avant sa création complète
   - ❌ Cela causait des erreurs lors de la création des contraintes

**2. Authentification Supabase non activée :**
   - ❌ Référence directe vers `auth.users` qui peut ne pas exister

#### **✅ Solutions implémentées dans la version actuelle :**

**1. Contraintes FK ajoutées en fin de script :**
   - ✅ Les références vers `user_profiles(id)` sont maintenant des simples colonnes UUID
   - ✅ Les contraintes FK sont ajoutées **après** création de toutes les tables
   - ✅ Évite complètement les dépendances circulaires

**2. Script autonome sans auth.users :**
   - ✅ `user_profiles` utilise `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
   - ✅ Colonne optionnelle `auth_user_id UUID` pour lien futur
   - ✅ Script de migration `001_schema_buddybill_with_auth.sql` disponible

#### **Architecture des contraintes FK :**

```sql
-- 1. Création des tables avec colonnes UUID simples
CREATE TABLE app_data.quotes (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id),
    created_by UUID, -- ← Simple UUID, pas de FK encore
    ...
);

-- 2. Ajout des contraintes FK en fin de script
ALTER TABLE app_data.quotes 
ADD CONSTRAINT fk_quotes_created_by 
FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);
```

#### **Avantages de cette approche :**
- 🚀 **Déploiement sans erreur** : Plus de dépendances circulaires
- 🔧 **Ordre d'exécution optimal** : Tables créées d'abord, contraintes ensuite  
- 🛡️ **Intégrité préservée** : Toutes les contraintes FK sont maintenues
- 📈 **Évolutivité** : Structure prête pour authentification future

## Vérification

Après déploiement, vérifiez :

```sql
-- Vérifier les tables
SELECT tablename FROM pg_tables 
WHERE schemaname IN ('public', 'app_data', 'billing', 'settings');

-- Vérifier RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname IN ('public', 'app_data', 'billing', 'settings');

-- Vérifier les triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
