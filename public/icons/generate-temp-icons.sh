#!/bin/bash

# Script temporaire pour générer des icônes de test pour BuddyBill PWA
# Ces icônes seront remplacées par de vraies icônes plus tard

echo "🎨 Génération d'icônes temporaires pour BuddyBill PWA..."

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé. Installant via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "⚠️ Homebrew non trouvé. Veuillez installer ImageMagick manuellement."
        echo "💡 Ou téléchargez des icônes prêtes depuis: https://favicon.io"
        exit 1
    fi
fi

# Créer une icône de base avec ImageMagick
create_icon() {
    local size=$1
    local filename="icon-${size}x${size}.png"
    
    convert -size ${size}x${size} xc:'#3b82f6' \
        -gravity center \
        -font Arial-Bold \
        -pointsize $((size/4)) \
        -fill white \
        -annotate 0 'B$' \
        "$filename"
    
    echo "✅ Créé: $filename"
}

# Tailles requises pour PWA
sizes=(72 96 128 144 152 192 384 512)

echo "📱 Création des icônes principales..."
for size in "${sizes[@]}"; do
    create_icon $size
done

# Créer les icônes de raccourcis
echo "🔗 Création des icônes de raccourcis..."

# Icône groupe (vert)
convert -size 96x96 xc:'#10b981' \
    -gravity center \
    -font Arial-Bold \
    -pointsize 24 \
    -fill white \
    -annotate 0 'G' \
    "shortcut-group.png"

# Icône dépense (rouge)  
convert -size 96x96 xc:'#ef4444' \
    -gravity center \
    -font Arial-Bold \
    -pointsize 24 \
    -fill white \
    -annotate 0 '$' \
    "shortcut-expense.png"

# Icône balance (orange)
convert -size 96x96 xc:'#f59e0b' \
    -gravity center \
    -font Arial-Bold \
    -pointsize 24 \
    -fill white \
    -annotate 0 '⚖' \
    "shortcut-balance.png"

echo "🎉 Toutes les icônes temporaires ont été générées!"
echo "📝 Ces icônes sont temporaires. Consultez ICONS_GUIDE.md pour créer de vraies icônes."
echo "🚀 Vous pouvez maintenant tester l'installation PWA de BuddyBill!"
