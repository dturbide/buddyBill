# 📋 RAPPORT D'ANALYSE - SCRIPTS SQL EXISTANTS

## 🏗️ **ARCHITECTURE ACTUELLE**

### **📁 Structure des dossiers :**
```
scripts/
├── expense-sharing/ (87 fichiers) - Application originale de partage de dépenses
├── buddybill/ (4 fichiers) - Application BuddyBill multi-tenant
└── fichiers divers de migration et debug
```

---

## 📊 **SCRIPTS PRINCIPAUX IDENTIFIÉS**

### **🎯 SCRIPTS BUDDYBILL (Application cible) :**

| Fichier | Rôle | Status |
|---------|------|--------|
| `buddybill/001_schema_buddybill.sql` | **Schéma principal multi-tenant** - Tables : tenants, user_profiles, customers, quotes, jobs, invoices | ✅ **DÉPLOYÉ** |
| `buddybill/002_rls_buddybill.sql` | **Politiques RLS** - Sécurité par tenant_id et rôles | ✅ **DÉPLOYÉ** |
| `buddybill/003_auth_triggers_buddybill.sql` | **Triggers d'authentification** - Hooks auth automatiques | ✅ **DÉPLOYÉ** |
| `buddybill/DEPLOY_BUDDYBILL.md` | **Guide de déploiement** - Procédures d'installation | ✅ **DOCUMENTÉ** |

### **🗂️ SCRIPTS EXPENSE-SHARING (Legacy) :**

| Fichier | Rôle | Utilité pour BuddyBill |
|---------|------|------------------------|
| `001_schema_expense_sharing.sql` | Schéma expense-sharing avec groups, members, expenses | ❌ **NON APPLICABLE** (app différente) |
| `002_functions_expense_sharing.sql` | Fonctions métier expense-sharing | ❌ **NON APPLICABLE** |
| `003_rls_policies_expense_sharing.sql` | Politiques RLS expense-sharing | ❌ **NON APPLICABLE** |
| `004-007_*.sql` | Triggers, API helpers, storage | ❌ **NON APPLICABLE** |

### **🔧 SCRIPTS DE MIGRATION/DEBUG :**

| Fichier | Rôle | Status |
|---------|------|--------|
| `000_deploy_all.sql` | Script de déploiement automatique | 🔄 **UTILE** (référence) |
| `check_*` (15 fichiers) | Scripts de diagnostic base de données | 🔄 **UTILE** (maintenance) |
| `fix_*` (12 fichiers) | Scripts de correction d'erreurs | 🔄 **UTILE** (maintenance) |
| Autres migrations | Scripts de migration des données | ❌ **OBSOLÈTES** |

---

## 🎯 **TABLES EXISTANTES DANS BUDDYBILL**

### **✅ Tables déjà créées (schéma public) :**

| Table | Schéma | Utilité |
|-------|--------|---------|
| `public.tenants` | ✅ | Entreprises clientes (multi-tenant) |
| `public.user_profiles` | ✅ | Profils utilisateurs de base |
| `public.customers` | ✅ | Clients des entreprises |
| `app_data.services` | ✅ | Services offerts |
| `app_data.quotes` | ✅ | Devis |
| `app_data.jobs` | ✅ | Projets/travaux |
| `billing.invoices` | ✅ | Factures |
| `billing.payments` | ✅ | Paiements |

### **⚠️ Colonnes manquantes dans user_profiles :**

**Structure actuelle :**
```sql
public.user_profiles (
    id, tenant_id, full_name, role, email, phone, avatar_url, 
    created_at, updated_at
)
```

**Colonnes manquantes pour le plan profil :**
- ❌ `preferred_language` - Langue préférée 
- ❌ `preferred_currency` - Devise de base utilisateur
- ❌ `timezone` - Fuseau horaire
- ❌ `date_format` - Format de date préféré
- ❌ `currency_display_mode` - Mode d'affichage des devises
- ❌ `notification_preferences` - Préférences notifications
- ❌ `theme_preference` - Thème clair/sombre

---

## 🚀 **TABLES MANQUANTES POUR LE PLAN**

### **💱 Système multi-devises :**
- ❌ `public.currency_rates` - Taux de change
- ❌ `public.currency_cache` - Cache des taux

### **📅 Système d'abonnements :**
- ❌ `public.subscriptions` - Abonnements tenants
- ❌ `public.subscription_plans` - Plans d'abonnement 
- ❌ `public.billing_periods` - Périodes de facturation
- ❌ `public.subscription_renewals` - Renouvellements

### **🔔 Système de notifications :**
- ❌ `public.notification_templates` - Modèles notifications
- ❌ `public.user_notifications` - Notifications utilisateur

---

## 📋 **FONCTIONS/TRIGGERS MANQUANTS**

### **🔧 Fonctions métier :**
- ❌ `convert_currency()` - Conversion entre devises
- ❌ `get_exchange_rate()` - Récupération taux de change
- ❌ `calculate_subscription_end()` - Calcul fin d'abonnement
- ❌ `send_renewal_reminder()` - Rappels de renouvellement

### **⚙️ Triggers automatiques :**
- ❌ Trigger mise à jour user_preferences
- ❌ Trigger expiration abonnements
- ❌ Trigger rappels de renouvellement

---

## 📈 **RECOMMANDATIONS**

### **🎯 Actions prioritaires :**

1. **✅ CONSERVER** l'architecture BuddyBill existante
2. **🔄 ÉTENDRE** `public.user_profiles` avec colonnes profil
3. **➕ AJOUTER** tables système multi-devises
4. **➕ AJOUTER** tables système d'abonnements  
5. **🔧 CRÉER** fonctions et triggers manquants

### **⚠️ Éviter :**
- ❌ Dupliquer les tables existantes
- ❌ Modifier l'architecture multi-tenant
- ❌ Créer des objets hors du schéma public (selon demande)
- ❌ Casser les relations existantes

---

## 🎯 **PLAN D'EXÉCUTION**

### **Phase 1 : Extensions user_profiles**
- Ajouter colonnes préférences utilisateur
- Maintenir compatibilité existante

### **Phase 2 : Système multi-devises**
- Tables taux de change et cache
- Fonctions de conversion

### **Phase 3 : Système d'abonnements**
- Tables abonnements et facturation
- Triggers de rappels automatiques

### **Phase 4 : Fonctionnalités avancées**
- Notifications et templates
- Optimisations performances

**TOTAL ESTIMÉ :** 4 nouveaux scripts SQL ordonnés
