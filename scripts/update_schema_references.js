#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration des replacements à effectuer
const REPLACEMENTS = [
  // Remplacer les références app.* par public.*
  { from: /app\.expenses/g, to: 'expenses' },
  { from: /app\.expense_participants/g, to: 'expense_participants' },
  { from: /app\.expense_categories/g, to: 'expense_categories' },
  { from: /app\.payments/g, to: 'payments' },
  { from: /app\.activity_log/g, to: 'activity_log' },
  { from: /app\.group_invitations/g, to: 'group_invitations' },
  
  // Remplacer les vues _view par les tables directes maintenant qu'elles sont dans public
  { from: /expenses_view/g, to: 'expenses' },
  { from: /expense_participants_view/g, to: 'expense_participants' },
  { from: /expense_categories_view/g, to: 'expense_categories' },
  { from: /payments_view/g, to: 'payments' },
  
  // Corriger les références aux fonctions
  { from: /app\.get_user_balance_in_group/g, to: 'public.get_user_balance_in_group' },
  { from: /app\.update_updated_at_column/g, to: 'public.update_updated_at_column' },
  { from: /app\.get_user_avatar_url/g, to: 'public.get_user_avatar_url' },
  { from: /app\.get_group_image_url/g, to: 'public.get_group_image_url' },
  { from: /app\.get_receipt_url/g, to: 'public.get_receipt_url' },
];

// Fichiers et dossiers à traiter
const PATHS_TO_PROCESS = [
  'app/api',
  'app/actions',
  'components',
  'lib',
  'app/test-db'
];

// Extensions de fichiers à traiter
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function findFiles(dir, extensions) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`Dossier ${dir} n'existe pas, ignoré.`);
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const replacement of REPLACEMENTS) {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        modified = true;
        content = newContent;
        console.log(`✓ ${filePath}: ${replacement.from} → ${replacement.to}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Début de la mise à jour des références de schéma...\n');
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const pathToProcess of PATHS_TO_PROCESS) {
    const files = findFiles(pathToProcess, FILE_EXTENSIONS);
    totalFiles += files.length;
    
    console.log(`📁 Traitement de ${pathToProcess} (${files.length} fichiers):`);
    
    for (const file of files) {
      if (updateFile(file)) {
        modifiedFiles++;
      }
    }
    
    console.log('');
  }
  
  console.log('✅ Mise à jour terminée !');
  console.log(`📊 Statistiques:`);
  console.log(`   - Fichiers analysés: ${totalFiles}`);
  console.log(`   - Fichiers modifiés: ${modifiedFiles}`);
  console.log(`   - Fichiers inchangés: ${totalFiles - modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    console.log('\n⚠️  IMPORTANT: Veuillez vérifier que l\'application fonctionne correctement après ces modifications.');
    console.log('💡 Redémarrez votre serveur de développement si nécessaire.');
  }
}

// Exécuter le script
main();
