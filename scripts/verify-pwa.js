#!/usr/bin/env node

/**
 * Script de vérification PWA pour BuddyBill
 * 
 * Ce script vérifie que tous les éléments nécessaires pour une PWA sont présents
 * et correctement configurés avant le déploiement.
 */

const fs = require('fs');
const path = require('path');

// Couleurs ANSI simples
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Fonctions d'affichage coloré
const log = {
  info: (text) => console.log(`${colors.blue}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}${text}${colors.reset}`),
  warning: (text) => console.log(`${colors.yellow}${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}${text}${colors.reset}`),
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`
};

log.info('🔍 Vérification de la configuration PWA pour BuddyBill...');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// Fonction pour vérifier l'existence d'un fichier
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log.success(`✅ ${description} trouvé: ${path.relative(rootDir, filePath)}`);
    return true;
  } else {
    log.error(`❌ ${description} manquant: ${path.relative(rootDir, filePath)}`);
    return false;
  }
}

// Fonction pour vérifier le contenu JSON
function checkJsonContent(filePath, requiredFields) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!content[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length === 0) {
      log.success(`✅ Tous les champs requis sont présents dans ${path.relative(rootDir, filePath)}`);
      return true;
    } else {
      log.warning(`⚠️ Champs manquants dans ${path.relative(rootDir, filePath)}: ${missingFields.join(', ')}`);
      return false;
    }
  } catch (error) {
    log.error(`❌ Erreur lors de la lecture de ${path.relative(rootDir, filePath)}: ${error.message}`);
    return false;
  }
}

// Vérifier le manifeste
const manifestPath = path.join(publicDir, 'manifest.json');
const manifestExists = checkFile(manifestPath, 'Manifeste PWA');
let manifestValid = false;

if (manifestExists) {
  manifestValid = checkJsonContent(manifestPath, [
    'name', 
    'short_name', 
    'icons', 
    'start_url', 
    'display', 
    'background_color', 
    'theme_color'
  ]);
}

// Vérifier les icônes
const iconsDir = path.join(publicDir, 'icons');
const iconsDirExists = checkFile(iconsDir, 'Dossier des icônes');

const requiredIconSizes = [
  '72x72', '96x96', '128x128', '144x144', 
  '152x152', '192x192', '384x384', '512x512'
];

let iconsValid = false;
if (iconsDirExists) {
  const iconFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.png'));
  const missingIcons = [];
  
  for (const size of requiredIconSizes) {
    const iconExists = iconFiles.some(file => file.includes(size));
    if (!iconExists) {
      missingIcons.push(size);
    }
  }
  
  if (missingIcons.length === 0) {
    log.success('✅ Toutes les tailles d\'icônes requises sont présentes');
    iconsValid = true;
  } else {
    log.warning(`⚠️ Tailles d'icônes manquantes: ${missingIcons.join(', ')}`);
  }
}

// Vérifier les captures d'écran
const screenshotsDir = path.join(publicDir, 'screenshots');
const screenshotsDirExists = checkFile(screenshotsDir, 'Dossier des captures d\'écran');

// Vérifier le layout.tsx pour les méta-tags PWA
const layoutPath = path.join(rootDir, 'app', 'layout.tsx');
const layoutExists = checkFile(layoutPath, 'Fichier layout.tsx');

let layoutValid = false;
if (layoutExists) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const hasPwaMetaTags = layoutContent.includes('manifest.json') && 
                         layoutContent.includes('apple-touch-icon');
  
  if (hasPwaMetaTags) {
    log.success('✅ Les méta-tags PWA sont présents dans layout.tsx');
    layoutValid = true;
  } else {
    log.warning('⚠️ Les méta-tags PWA semblent manquer dans layout.tsx');
  }
}

// Vérifier le composant d'installation PWA
const installComponentPath = path.join(rootDir, 'components', 'install-pwa-instructions.tsx');
checkFile(installComponentPath, 'Composant d\'installation PWA');

// Résumé
console.log('\n');
log.info('📋 Résumé de la vérification PWA:');

const allValid = manifestValid && iconsValid && layoutValid;

if (allValid) {
  log.success('✅ La configuration PWA est complète et valide!');
  log.success('🚀 BuddyBill est prêt à être déployé comme PWA.');
} else {
  log.warning('⚠️ Certains éléments de la configuration PWA nécessitent votre attention.');
  log.warning('📝 Consultez les messages ci-dessus pour plus de détails.');
}

// Conseils supplémentaires
console.log('\n');
log.info('💡 Conseils pour tester la PWA:');
console.log(`1. Exécutez ${log.cyan('npm run build && npm run start')} pour tester en mode production`);
console.log('2. Ouvrez Chrome DevTools > Application > Manifest pour vérifier le manifeste');
console.log('3. Utilisez Lighthouse pour analyser les performances PWA');
console.log('4. Testez l\'installation sur différents appareils (Android, iOS, Desktop)');
console.log('5. Vérifiez que les raccourcis fonctionnent correctement');

console.log('\n');
log.info('🔗 Documentation utile:');
console.log('- Guide PWA: https://web.dev/progressive-web-apps/');
console.log('- Manifeste Web: https://developer.mozilla.org/fr/docs/Web/Manifest');
console.log('- PWA avec Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/pwa');
