# 🚀 Guide de Déploiement BuddyBill

## 📋 Prérequis

- [x] Compte GitHub
- [x] Compte Vercel
- [x] Projet Supabase configuré
- [x] Variables d'environnement prêtes

## 🔧 Variables d'Environnement Requises

### Supabase (OBLIGATOIRE)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vxedjtvobiprlnacidhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### API Devises (OPTIONNEL)
```bash
FIXER_API_KEY=votre_fixer_api_key
EXCHANGERATE_API_KEY=votre_exchangerate_api_key
```

### Sécurité (OPTIONNEL)
```bash
CRON_SECRET_TOKEN=token_securise_pour_cron_jobs
```

## 📤 Étapes de Déploiement

### 1. Pousser vers GitHub

```bash
# Vérifier l'état Git
git status

# Ajouter tous les fichiers
git add .

# Commit avec message descriptif
git commit -m "🚀 BuddyBill v1.0 - Application complète de partage de dépenses

✅ Fonctionnalités principales :
- Système multi-devises avec conversion temps réel
- Interface multilingue français/anglais
- Architecture multitenant sécurisée
- Dashboard moderne avec statistiques
- Authentification Supabase + RLS
- API optimisées avec cache intelligent

✅ Stack technique :
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase PostgreSQL
- i18next pour l'internationalisation
- API de devises avec fallback

✅ Sécurité :
- Isolation complète des données utilisateur
- Politiques RLS robustes
- Authentification sécurisée
- Gestion d'erreurs complète"

# Créer le repository distant (si pas encore fait)
git remote add origin https://github.com/denisturbide/buddybill-expense-sharing.git

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

### 2. Déployer sur Vercel

#### Option A : Via l'interface web
1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer "New Project"
3. Importer depuis GitHub : `denisturbide/buddybill-expense-sharing`
4. Vercel détectera automatiquement Next.js
5. Configurer les variables d'environnement (voir section ci-dessous)
6. Déployer

#### Option B : Via CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer en production
vercel --prod
```

### 3. Configuration Vercel

Dans les paramètres du projet Vercel > Environment Variables :

```
NEXT_PUBLIC_SUPABASE_URL = https://vxedjtvobiprlnacidhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIXER_API_KEY = your_fixer_api_key (optionnel)
CRON_SECRET_TOKEN = your_secure_token (optionnel)
```

### 4. Configuration Supabase

1. **Ajouter l'URL Vercel** dans Supabase Dashboard
   - Aller dans Authentication > URL Configuration
   - Ajouter : `https://buddybill-expense-sharing.vercel.app`

2. **Vérifier les politiques RLS**
   - Toutes les tables doivent avoir leurs politiques activées
   - Tester l'authentification en production

## 🧪 Tests Post-Déploiement

### Checklist de Validation
- [ ] Page d'accueil se charge correctement
- [ ] Authentification fonctionne (signup/signin)
- [ ] Création de groupe réussie
- [ ] Ajout de dépense fonctionnel
- [ ] Conversion de devises opérationnelle
- [ ] Sélecteur de langue réactif
- [ ] Dashboard affiche les bonnes données
- [ ] Responsive design sur mobile

### URLs à Tester
```
https://buddybill-expense-sharing.vercel.app/           # Page d'accueil
https://buddybill-expense-sharing.vercel.app/signin    # Connexion
https://buddybill-expense-sharing.vercel.app/signup    # Inscription
https://buddybill-expense-sharing.vercel.app/dashboard # Dashboard
```

## 🐛 Résolution de Problèmes

### Erreurs Communes

#### 1. Erreur d'authentification Supabase
**Symptôme** : `Invalid JWT` ou `Auth session missing`
**Solution** :
- Vérifier que l'URL Vercel est dans Site URL de Supabase
- Vérifier les clés API dans les variables d'environnement
- Redéployer après changement de variables

#### 2. Erreur de base de données
**Symptôme** : `relation "table_name" does not exist`
**Solution** :
- Exécuter tous les scripts SQL dans l'ordre
- Vérifier que les politiques RLS sont activées
- Vérifier les permissions utilisateur

#### 3. Erreur de conversion de devises
**Symptôme** : Devises ne se convertissent pas
**Solution** :
- Vérifier la clé API Fixer.io (optionnel)
- Le système utilise ExchangeRate-API gratuit par défaut
- Vérifier les logs Vercel pour erreurs API

#### 4. Interface non traduite
**Symptôme** : Textes restent en anglais
**Solution** :
- Vérifier que les fichiers de traduction sont présents
- Cookies de langue pas bloqués
- Recharger la page ou vider le cache

### Logs et Debugging

```bash
# Voir les logs Vercel
vercel logs buddybill-expense-sharing --follow

# Logs en local
pnpm dev

# Build local pour tester
pnpm build && pnpm start
```

## 📊 Monitoring

### Métriques à Surveiller
- Performance des pages (Core Web Vitals)
- Taux d'erreur des API
- Utilisation des conversions de devises
- Connexions utilisateur
- Erreurs Supabase

### Outils Recommandés
- **Vercel Analytics** : Performance et usage
- **Supabase Dashboard** : Monitoring base de données
- **Vercel Speed Insights** : Métriques de performance
- **Sentry** : Tracking d'erreurs (optionnel)

## 🔄 Mises à Jour

### Déploiement Continu
Chaque push sur `main` déclenchera automatiquement un redéploiement Vercel.

### Process de Mise à Jour
1. Développement et tests en local
2. Commit et push vers GitHub
3. Déploiement automatique Vercel
4. Tests post-déploiement
5. Monitoring des métriques

---

## 🎉 Félicitations !

Votre application BuddyBill est maintenant déployée et accessible au monde entier ! 

**URL de production** : https://buddybill-expense-sharing.vercel.app

N'oubliez pas de partager le lien avec vos utilisateurs et de surveiller les métriques de performance ! 🚀
