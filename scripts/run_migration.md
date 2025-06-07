# Migration du Schéma APP vers PUBLIC

## Instructions pour exécuter la migration

### 1. Connectez-vous à Supabase Dashboard
- Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Sélectionnez votre projet : **xyqefesczgykmwxbitmq**

### 2. Accédez au SQL Editor
- Dans le menu latéral, cliquez sur **SQL Editor**
- Cliquez sur **New Query**

### 3. Copiez et exécutez le script
- Ouvrez le fichier `scripts/complete_migration_app_to_public.sql`
- Copiez tout le contenu du fichier
- Collez-le dans le SQL Editor de Supabase
- Cliquez sur **Run** pour exécuter la migration

### 4. Vérifications après migration
Une fois le script exécuté, vérifiez que :
- ✅ Les tables ont été déplacées vers le schéma `public`
- ✅ Les politiques RLS sont actives
- ✅ Les types enum sont dans `public`
- ✅ Les fonctions sont opérationnelles

### 5. Démarrer l'application
Après la migration réussie :
```bash
cd /Users/denisturbide/Desktop/expense-sharing-app-dashboard
pnpm dev
```

### ⚠️ Important
Cette migration va :
- Déplacer toutes les tables de `app` vers `public`
- Recréer les politiques RLS appropriées
- Mettre à jour les fonctions et triggers
- **CONSERVER toutes vos données existantes**

Temps estimé : 2-3 minutes maximum.
