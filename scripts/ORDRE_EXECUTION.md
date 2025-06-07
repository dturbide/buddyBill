# 🚀 ORDRE D'EXÉCUTION DES SCRIPTS DE RESTAURATION

## ⚠️ IMPORTANT : Exécutez les scripts dans cet ordre exact !

### 1️⃣ **PREMIÈRE ÉTAPE : Restaurer le schéma public**
```sql
-- Dans Supabase SQL Editor, exécutez :
-- /scripts/restore_public_schema.sql
```
**Ce script restaure :**
- Table `public.user_profiles` 
- Table `public.groups`
- Table `public.group_members`
- Types enum nécessaires
- Politiques RLS
- Triggers automatiques

### 2️⃣ **DEUXIÈME ÉTAPE : Restaurer le schéma app**
```sql
-- Dans Supabase SQL Editor, exécutez :
-- /scripts/restore_app_schema.sql
```
**Ce script restaure :**
- Schéma `app` complet
- Tables des dépenses et paiements
- Catégories par défaut
- Fonctions utilitaires

### 3️⃣ **TROISIÈME ÉTAPE : Ajouter les codes d'invitation**
```sql
-- Dans Supabase SQL Editor, exécutez :
-- /scripts/add_invite_codes_to_public_groups.sql
```
**Ce script ajoute :**
- Colonne `invite_code` à `public.groups`
- Fonction de génération de codes
- Fonction `join_group_by_code()`
- Codes pour groupes existants

## 🎯 **Après l'exécution :**

1. **Redémarrez le serveur Next.js**
   ```bash
   # Arrêtez avec Ctrl+C puis :
   npm run dev
   ```

2. **Testez l'application :**
   - Connexion/inscription
   - Création de groupe (avec code d'invitation)
   - Liste des groupes (avec codes visibles)
   - Rejoindre un groupe via code

## 🔧 **Architecture finale :**

- **Schéma `public`** : user_profiles, groups, group_members (avec invite_code)
- **Schéma `app`** : expenses, payments, expense_categories, etc.
- **Fonctionnalités** : Codes d'invitation sécurisés et permanents

---

**Note :** Si vous avez une erreur, arrêtez-vous et signalez le problème avant de continuer !
