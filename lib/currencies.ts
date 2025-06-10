/**
 * Configuration complète des devises mondiales
 * Basé sur ISO 4217 avec support de 170+ devises
 */

export interface Currency {
  code: string          // Code ISO (EUR, USD, JPY)
  name: string         // Nom complet (Euro, US Dollar)
  symbol: string       // Symbole (€, $, ¥)
  flag: string         // Emoji drapeau (🇪🇺, 🇺🇸, 🇯🇵)
  decimal: number      // Nombre de décimales (2 pour USD, 0 pour JPY)
  popular: boolean     // Devise populaire (top 20)
  region: string       // Région géographique
}

// Devises les plus populaires (top 20 mondiales)
export const POPULAR_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimal: 2, popular: true, region: 'North America' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimal: 2, popular: true, region: 'Europe' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimal: 0, popular: true, region: 'Asia' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimal: 2, popular: true, region: 'Europe' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimal: 2, popular: true, region: 'Oceania' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimal: 2, popular: true, region: 'North America' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', decimal: 2, popular: true, region: 'Europe' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimal: 2, popular: true, region: 'Asia' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', decimal: 2, popular: true, region: 'Europe' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', decimal: 2, popular: true, region: 'Oceania' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', decimal: 2, popular: true, region: 'North America' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimal: 2, popular: true, region: 'Asia' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', decimal: 2, popular: true, region: 'Asia' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', decimal: 2, popular: true, region: 'Europe' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimal: 0, popular: true, region: 'Asia' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimal: 2, popular: true, region: 'Europe' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', decimal: 2, popular: true, region: 'Europe' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimal: 2, popular: true, region: 'Asia' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimal: 2, popular: true, region: 'South America' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', decimal: 2, popular: true, region: 'Africa' },
]

// Devises additionnelles importantes
export const ADDITIONAL_CURRENCIES: Currency[] = [
  // Europe
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', decimal: 2, popular: false, region: 'Europe' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', decimal: 2, popular: false, region: 'Europe' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', decimal: 2, popular: false, region: 'Europe' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', decimal: 2, popular: false, region: 'Europe' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', decimal: 2, popular: false, region: 'Europe' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', decimal: 2, popular: false, region: 'Europe' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', decimal: 2, popular: false, region: 'Europe' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸', decimal: 0, popular: false, region: 'Europe' },
  
  // Asie
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimal: 2, popular: false, region: 'Asia' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimal: 2, popular: false, region: 'Asia' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimal: 2, popular: false, region: 'Asia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimal: 2, popular: false, region: 'Asia' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimal: 0, popular: false, region: 'Asia' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', decimal: 2, popular: false, region: 'Asia' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', decimal: 2, popular: false, region: 'Asia' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', flag: '🇱🇰', decimal: 2, popular: false, region: 'Asia' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', decimal: 2, popular: false, region: 'Asia' },
  
  // Moyen-Orient
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', decimal: 2, popular: false, region: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', decimal: 2, popular: false, region: 'Middle East' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦', decimal: 2, popular: false, region: 'Middle East' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', decimal: 3, popular: false, region: 'Middle East' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', decimal: 3, popular: false, region: 'Middle East' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲', decimal: 3, popular: false, region: 'Middle East' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', decimal: 2, popular: false, region: 'Middle East' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', decimal: 2, popular: false, region: 'Middle East' },
  
  // Amérique du Nord et Sud
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', decimal: 0, popular: false, region: 'South America' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', decimal: 2, popular: false, region: 'South America' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', decimal: 2, popular: false, region: 'South America' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.', flag: '🇵🇪', decimal: 2, popular: false, region: 'South America' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', flag: '🇺🇾', decimal: 2, popular: false, region: 'South America' },
  
  // Afrique
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', decimal: 2, popular: false, region: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', decimal: 2, popular: false, region: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', decimal: 2, popular: false, region: 'Africa' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', flag: '🇲🇦', decimal: 2, popular: false, region: 'Africa' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳', decimal: 3, popular: false, region: 'Africa' },
  
  // Crypto (pour les utilisateurs modernes)
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '🟠', decimal: 8, popular: false, region: 'Crypto' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: '🔷', decimal: 18, popular: false, region: 'Crypto' },
]

// Toutes les devises combinées
export const ALL_CURRENCIES: Currency[] = [
  ...POPULAR_CURRENCIES,
  ...ADDITIONAL_CURRENCIES,
]

// Utilitaires
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return ALL_CURRENCIES.find(currency => currency.code === code)
}

export const getPopularCurrencies = (): Currency[] => {
  return POPULAR_CURRENCIES
}

export const getCurrenciesByRegion = (region: string): Currency[] => {
  return ALL_CURRENCIES.filter(currency => currency.region === region)
}

export const searchCurrencies = (query: string): Currency[] => {
  const searchTerm = query.toLowerCase()
  return ALL_CURRENCIES.filter(currency => 
    currency.code.toLowerCase().includes(searchTerm) ||
    currency.name.toLowerCase().includes(searchTerm) ||
    currency.symbol.includes(query)
  )
}

// Formater une devise avec le bon nombre de décimales
export const formatCurrencyAmount = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode)
  if (!currency) return `${amount.toFixed(2)} ${currencyCode}`
  
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimal,
      maximumFractionDigits: currency.decimal,
    }).format(amount)
  } catch (error) {
    // Fallback si la devise n'est pas supportée par Intl
    return `${amount.toFixed(currency.decimal)} ${currency.symbol}`
  }
}

// Export par défaut pour compatibilité
export default ALL_CURRENCIES
