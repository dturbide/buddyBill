import { twMerge } from "tailwind-merge"
import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback si la devise n'est pas supportée
    return `${amount.toFixed(2)} ${currency}`
  }
}

// Fonction améliorée pour formatage multi-devises avec conversion automatique
export function formatCurrencyWithConversion(
  amount: number, 
  originalCurrency: string,
  displayCurrency?: string,
  conversionRate?: number
): string {
  // Si pas de conversion demandée, utiliser la fonction standard
  if (!displayCurrency || originalCurrency === displayCurrency) {
    return formatCurrency(amount, originalCurrency);
  }
  
  // Si on a un taux de conversion, appliquer la conversion
  if (conversionRate && conversionRate > 0) {
    const convertedAmount = amount * conversionRate;
    return formatCurrency(convertedAmount, displayCurrency);
  }
  
  // Sinon, afficher la devise originale
  return formatCurrency(amount, originalCurrency);
}

// Fonction pour obtenir le symbole de devise sans montant
export function getCurrencySymbol(currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0).replace(/[\d\s]/g, '');
  } catch (error) {
    // Symboles de devises courantes en fallback
    const symbols: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'CAD': 'CA$',
      'GBP': '£',
      'CHF': 'CHF',
      'JPY': '¥',
      'AUD': 'A$'
    };
    return symbols[currency] || currency;
  }
}

// Fonction pour formatter un montant avec indication de conversion
export function formatCurrencyWithIndicator(
  amount: number,
  originalCurrency: string,
  displayCurrency?: string,
  showOriginal: boolean = true
): string {
  if (!displayCurrency || originalCurrency === displayCurrency || !showOriginal) {
    return formatCurrency(amount, displayCurrency || originalCurrency);
  }
  
  // Format: "100.00 € (≈ $118.00)"
  const original = formatCurrency(amount, originalCurrency);
  const convertedAmount = formatCurrencyWithConversion(amount, originalCurrency, displayCurrency);
  const symbol = getCurrencySymbol(displayCurrency);
  return `${original} (≈ ${convertedAmount})`;
}
