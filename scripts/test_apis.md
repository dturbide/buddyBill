# Test des APIs du système de balances et paiements

## URLs à tester dans le navigateur (une fois connecté)

### 1. API Balances
```
GET /api/balances
```
- Calcule et retourne les balances globales de l'utilisateur
- Inclut les totaux, balances par personne et par groupe

### 2. API Groups  
```
GET /api/groups
```
- Retourne la liste des groupes avec leurs membres
- Nécessaire pour le formulaire de paiement

### 3. API Payments
```
POST /api/payments
```
Body example:
```json
{
  "groupId": "uuid-ou-null",
  "payerId": "uuid-utilisateur-payeur", 
  "payeeId": "uuid-utilisateur-beneficiaire",
  "amount": 25.50,
  "currency": "EUR",
  "description": "Remboursement restaurant",
  "paymentDate": "2025-01-17T12:00:00Z"
}
```

```
GET /api/payments?groupId=uuid&limit=20
```
- Retourne l'historique des paiements de l'utilisateur

## Pages à tester

### Dashboard principal
- `/dashboard` - Tableau de bord général
- `/dashboard/settle-up` - Balances globales (utilise BalancesScreen)

### Gestion des paiements  
- `/dashboard/payments/add` - Formulaire d'enregistrement de paiement
- `/dashboard/payments` - Historique des paiements

## Fonctionnalités clés testées

✅ **Sécurité** : Toutes les APIs vérifient l'authentification
✅ **Validation** : Contrôle que payeur ≠ bénéficiaire, montant > 0
✅ **Permissions** : Seul le payeur ou admin du groupe peut enregistrer
✅ **Interface** : Navigation fluide entre balances et paiements
✅ **Responsive** : Interface adaptée mobile avec MobileCard
✅ **Gestion d'erreur** : États de chargement et messages d'erreur
✅ **Multi-devise** : Support EUR, USD, GBP, etc.
