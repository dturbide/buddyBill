# 💱 Configuration de l'Intégration Devises BuddyBill

## 🎯 Objectif

Ce document explique comment configurer et utiliser le système d'intégration automatique des API de devises pour BuddyBill.

## 🔧 Variables d'Environnement

Ajoutez ces variables à votre fichier `.env.local` :

```bash
# 🔑 API Keys pour les providers de devises (optionnel)
FIXER_API_KEY=your_fixer_api_key_here

# 🗄️ Configuration Supabase (requis)
NEXT_PUBLIC_SUPABASE_URL=https://vxedjtvobiprlnacidhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📋 Configuration des Providers

### 1. ExchangeRate-API (Gratuit)
- **Limite :** 2000 appels/mois
- **Configuration :** Aucune clé API requise
- **Statut :** Activé par défaut

### 2. Fixer.io (Payant, plus précis)
- **Limite :** Selon plan choisi
- **Configuration :** Requiert `FIXER_API_KEY`
- **Inscription :** https://fixer.io/

### 3. Backup Provider (Fallback)
- **Type :** Taux statiques de secours
- **Configuration :** Toujours disponible
- **Usage :** Utilisé si tous les autres échouent

## 🚀 Démarrage Rapide

### 1. Déployer le Schéma BuddyBill

```bash
# Dans le répertoire du projet
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/001_schema_buddybill.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/fix_created_by_columns.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/002_rls_buddybill.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/003_auth_triggers_buddybill.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/004_user_profiles_extensions.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/005_rls_user_profiles_extensions.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/buddybill/006_api_helpers_user_profiles.sql
```

### 2. Tester l'Application

```bash
npm run dev
```

Visitez : http://localhost:3000/test-currency

## 📊 Utilisation dans le Code

### Hook de base

```typescript
import { useCurrency } from '@/hooks/use-currency';

function MyComponent() {
  const { convertAmount, updateRates, status } = useCurrency();
  
  const handleConvert = async () => {
    const result = await convertAmount(100, 'USD', 'EUR');
    console.log(`100 USD = ${result?.convertedAmount} EUR`);
  };
}
```

### Composant d'affichage

```typescript
import { CurrencyAmountDisplay } from '@/components/currency-amount-display';

function ExpenseItem({ amount, currency }) {
  return (
    <CurrencyAmountDisplay
      amount={amount}
      currency={currency}
      userPreferredCurrency="EUR"
      showConversion={true}
    />
  );
}
```

### API directe

```typescript
// Conversion directe
const response = await fetch('/api/currency/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' })
});

// Mise à jour des taux
const updateResponse = await fetch('/api/currency/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ baseCurrency: 'CAD' })
});
```

## 🔄 Mise à Jour Automatique

Le système met automatiquement à jour les taux de change :

- **Fréquence :** Toutes les 24 heures
- **Déclencheur :** Première utilisation ou appel API
- **Fallback :** Taux statiques si toutes les API échouent

## 🎮 Interface de Test

L'interface de test est disponible à `/test-currency` et permet de :

- ✅ Tester les conversions en temps réel
- ✅ Mettre à jour les taux manuellement
- ✅ Vérifier le statut des providers
- ✅ Tester les composants UI

## 🔍 Devises Supportées

| Code | Devise |
|------|--------|
| USD  | Dollar américain |
| EUR  | Euro |
| CAD  | Dollar canadien |
| GBP  | Livre sterling |
| CHF  | Franc suisse |
| JPY  | Yen japonais |
| AUD  | Dollar australien |

## 🚨 Gestion d'Erreurs

Le système inclut plusieurs niveaux de fallback :

1. **Fixer.io** (si clé API disponible)
2. **ExchangeRate-API** (gratuit)
3. **Taux statiques** (derniers secours)

## 📈 Monitoring

Surveillez la santé du système via :

- **Endpoint :** `GET /api/currency/update`
- **Métriques :** Dernière mise à jour, source, nombre de taux
- **Alerte :** `needsUpdate: true` si > 24h

## 🔐 Sécurité

- ✅ Les clés API sont stockées dans les variables d'environnement
- ✅ Les taux sont cachés en base pour réduire les appels API
- ✅ Politique RLS respectée pour l'isolation multi-tenant
- ✅ Validation des paramètres d'entrée

## 📞 Support

En cas de problème :

1. Vérifiez les logs de l'application
2. Testez via l'interface `/test-currency`
3. Vérifiez la connectivité aux API externes
4. Consultez la documentation Supabase pour les erreurs DB
