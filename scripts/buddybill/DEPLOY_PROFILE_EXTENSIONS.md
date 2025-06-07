# 🚀 GUIDE DE DÉPLOIEMENT - EXTENSIONS PROFIL UTILISATEUR BUDDYBILL

## 📋 **VUE D'ENSEMBLE**

Ce guide détaille le déploiement des extensions pour la page profil utilisateur, le système multi-devises et la gestion d'abonnements dans BuddyBill.

### **🎯 Nouvelles fonctionnalités ajoutées :**
- ✅ Page profil utilisateur avec préférences complètes
- ✅ Système multi-devises avec conversion temps réel
- ✅ Affichage "Smart Currency" (double devise)
- ✅ Gestion d'abonnements avec renouvellements automatiques
- ✅ Système de notifications et rappels
- ✅ Audit complet des changements de préférences

---

## 📦 **SCRIPTS À DÉPLOYER**

### **🔄 Ordre d'exécution obligatoire :**

| Ordre | Script | Description | Prérequis |
|-------|--------|-------------|-----------|
| 1️⃣ | `004_user_profiles_extensions.sql` | **Extensions principales** - Tables, colonnes, fonctions métier | `001_schema_buddybill.sql` déployé |
| 2️⃣ | `005_rls_user_profiles_extensions.sql` | **Sécurité RLS** - Politiques d'accès et audit | Script 004 terminé |
| 3️⃣ | `006_api_helpers_user_profiles.sql` | **API Helpers** - Fonctions RPC pour frontend | Scripts 004 + 005 terminés |

---

## 🏗️ **DÉTAILS DES EXTENSIONS**

### **📊 Tables créées ou modifiées :**

#### **🔧 Extensions `public.user_profiles` :**
```sql
-- Nouvelles colonnes ajoutées :
preferred_language VARCHAR(5) DEFAULT 'fr'
preferred_currency VARCHAR(3) DEFAULT 'CAD'
timezone VARCHAR(50) DEFAULT 'America/Toronto'
date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY'
currency_display_mode VARCHAR(20) DEFAULT 'dual'
theme_preference VARCHAR(10) DEFAULT 'light'
notification_preferences JSONB
```

#### **💱 Nouvelles tables système multi-devises :**
- `public.supported_currencies` - Devises supportées
- `public.currency_rates` - Taux de change historiques
- `public.currency_cache` - Cache des taux (24h)

#### **📅 Nouvelles tables système d'abonnements :**
- `public.subscription_plans` - Plans d'abonnement (basic, pro, enterprise)
- `public.tenant_subscriptions` - Abonnements des tenants
- `public.subscription_renewals` - Historique des renouvellements
- `public.renewal_notifications` - Notifications automatiques

#### **📊 Tables d'audit :**
- `public.user_preferences_audit` - Audit des changements de préférences

---

## 🔧 **FONCTIONS PRINCIPALES CRÉÉES**

### **💰 Fonctions métier :**
- `convert_currency()` - Conversion entre devises avec cache
- `get_exchange_rate()` - Récupération des taux de change
- `format_currency_for_user()` - Formatage selon préférences utilisateur
- `calculate_subscription_end_date()` - Calcul fin d'abonnement

### **🔔 Fonctions de gestion :**
- `send_renewal_reminders()` - Rappels automatiques de renouvellement
- `process_expired_subscriptions()` - Traitement des abonnements expirés
- `cleanup_expired_currency_cache()` - Nettoyage cache expiré

### **🚀 Fonctions RPC (API) :**
- `get_user_profile()` - Récupération profil complet utilisateur
- `update_user_preferences()` - Mise à jour préférences
- `get_supported_currencies()` - Liste des devises supportées
- `convert_amount()` - Conversion de montants
- `get_tenant_subscription()` - Détails abonnement tenant
- `get_available_subscription_plans()` - Plans disponibles

---

## ⚙️ **DÉPLOIEMENT SUPABASE**

### **📝 Méthode 1 : Via l'interface Supabase**

1. **Connexion à votre projet Supabase**
   ```
   URL: https://vxedjtvobiprlnacidhj.supabase.co
   ```

2. **Accès à l'éditeur SQL**
   - Dashboard → SQL Editor → New Query

3. **Exécution des scripts (dans l'ordre) :**
   ```sql
   -- Script 1 : Extensions principales
   -- Copier-coller le contenu de 004_user_profiles_extensions.sql
   -- ✅ Exécuter
   
   -- Script 2 : Politiques RLS  
   -- Copier-coller le contenu de 005_rls_user_profiles_extensions.sql
   -- ✅ Exécuter
   
   -- Script 3 : API Helpers
   -- Copier-coller le contenu de 006_api_helpers_user_profiles.sql
   -- ✅ Exécuter
   ```

### **📝 Méthode 2 : Via Supabase CLI**

```bash
# 1. Installation Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Connexion au projet
supabase login
supabase link --project-ref vxedjtvobiprlnacidhj

# 3. Déploiement des scripts
supabase db push --file scripts/buddybill/004_user_profiles_extensions.sql
supabase db push --file scripts/buddybill/005_rls_user_profiles_extensions.sql  
supabase db push --file scripts/buddybill/006_api_helpers_user_profiles.sql
```

---

## ✅ **VÉRIFICATION DU DÉPLOIEMENT**

### **🧪 Tests de validation :**

```sql
-- 1. Vérifier les nouvelles colonnes user_profiles
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les devises supportées
SELECT code, name, symbol FROM public.supported_currencies WHERE is_active = true;

-- 3. Vérifier les plans d'abonnement
SELECT name, price_monthly, features FROM public.subscription_plans WHERE is_active = true;

-- 4. Tester la conversion de devise
SELECT * FROM public.convert_amount(100.00, 'CAD', 'USD');

-- 5. Tester les politiques RLS
SELECT * FROM public.test_rls_policies();

-- 6. Vérifier les fonctions RPC
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%' OR routine_name LIKE '%currency%';
```

### **📊 Validation des données :**

```sql
-- Vérifier que les données de test ont été insérées
SELECT COUNT(*) as devises_count FROM public.supported_currencies;
SELECT COUNT(*) as plans_count FROM public.subscription_plans;  
SELECT COUNT(*) as rates_count FROM public.currency_rates;
```

---

## 🎯 **INTÉGRATION FRONTEND**

### **🔗 Nouvelles API routes à créer :**

```typescript
// app/api/profile/route.ts
// app/api/currencies/route.ts  
// app/api/subscriptions/route.ts
// app/api/convert/route.ts
```

### **⚛️ Nouveaux composants React à développer :**

```typescript
// components/user-profile-page.tsx
// components/smart-currency.tsx
// components/currency-selector.tsx
// components/subscription-details.tsx
// components/notification-preferences.tsx
```

---

## 🔐 **SÉCURITÉ ET PERMISSIONS**

### **🛡️ Politiques RLS actives :**
- ✅ Accès aux profils par tenant_id ou utilisateur propriétaire
- ✅ Devises en lecture publique, modification admins uniquement
- ✅ Abonnements isolés par tenant
- ✅ Audit complet des changements de préférences

### **👥 Permissions par rôle :**

| Rôle | Profils | Devises | Abonnements | Audit |
|------|---------|---------|-------------|-------|
| **employee** | 👤 Son profil uniquement | 👁️ Lecture seule | 👁️ Lecture tenant | ❌ Aucun accès |
| **tenant_admin** | 👥 Tous profils tenant | 🔧 Lecture + Ajout taux | 🔧 Gestion complète | 👁️ Lecture tenant |
| **superadmin** | 🌍 Tous profils | 🔧 Gestion complète | 🌍 Tous tenants | 👁️ Audit global |

---

## 📈 **MONITORING ET MAINTENANCE**

### **🔄 Tâches automatiques recommandées :**

```sql
-- 1. Nettoyage quotidien du cache (CRON)
SELECT public.cleanup_expired_currency_cache();

-- 2. Traitement des abonnements expirés (quotidien)  
SELECT public.process_expired_subscriptions();

-- 3. Envoi des rappels de renouvellement (quotidien)
SELECT public.send_renewal_reminders();
```

### **📊 Métriques à surveiller :**
- Nombre d'utilisateurs avec préférences personnalisées
- Fréquence des conversions de devises
- Taux de renouvellement des abonnements  
- Performance des requêtes de conversion

---

## 🚨 **RÉSOLUTION DES PROBLÈMES**

### **❌ Erreurs communes :**

| Erreur | Cause | Solution |
|--------|-------|---------|
| `table "user_profiles" already exists` | Script exécuté plusieurs fois | ✅ Normal, utilise `IF NOT EXISTS` |
| `permission denied for schema public` | Permissions insuffisantes | Vérifier les droits Supabase |
| `function convert_currency does not exist` | Script 004 non exécuté | Exécuter dans l'ordre obligatoire |
| `policy already exists` | Script RLS exécuté plusieurs fois | ✅ Normal, script idempotent |

### **🔧 Commandes de diagnostic :**

```sql
-- Vérifier l'état des tables
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';

-- Vérifier les fonctions
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## ✨ **RÉSULTAT FINAL**

### **🎉 Fonctionnalités opérationnelles :**
- ✅ Page profil utilisateur complète avec préférences
- ✅ Système multi-devises avec 12 devises supportées
- ✅ Conversion automatique CAD ↔ USD/EUR/JPY/etc.
- ✅ Affichage dual currency pour les voyages
- ✅ Plans d'abonnement (Basic/Pro/Enterprise)
- ✅ Notifications automatiques de renouvellement
- ✅ Audit complet des changements
- ✅ Sécurité RLS multi-tenant renforcée

### **🚀 Prêt pour :**
- Développement des composants React
- Intégration API externes de taux de change
- Système de paiement Stripe pour abonnements
- Notifications email/SMS automatiques

---

**📧 SUPPORT :** En cas de problème, vérifier les logs Supabase et consulter la documentation des fonctions RPC créées.
