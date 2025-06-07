// Script Node.js pour générer des icônes PNG à partir du SVG
// Usage: node generate-png-icons.js

const fs = require('fs');
const path = require('path');

// Lire le SVG
const svgPath = path.join(__dirname, 'buddybill-logo-new.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('SVG content loaded for conversion');
console.log('Please use an online SVG to PNG converter or install imagemagick/rsvg-convert');
console.log('SVG path:', svgPath);

// Sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];

sizes.forEach(size => {
  console.log(`Generate ${size}x${size} PNG from SVG`);
});
