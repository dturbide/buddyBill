// 💱 Système d'intégration API devises automatique pour BuddyBill
// Supporte plusieurs providers avec fallback automatique

interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
  source: string;
}

interface CurrencyProvider {
  name: string;
  apiKey?: string;
  baseUrl: string;
  fetchRates: (base: string, targets: string[]) => Promise<ExchangeRate[]>;
  isAvailable: () => Promise<boolean>;
}

// Provider 1: ExchangeRate-API (Free tier 2000 calls/month)
const exchangeRateApiProvider: CurrencyProvider = {
  name: 'ExchangeRate-API',
  baseUrl: 'https://api.exchangerate-api.com/v4/latest',
  
  async fetchRates(base: string, targets: string[]): Promise<ExchangeRate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${base}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const today = new Date().toISOString().split('T')[0];
      
      return targets.map(target => ({
        base_currency: base,
        target_currency: target,
        rate: data.rates[target] || 1,
        date: today,
        source: this.name
      }));
    } catch (error) {
      console.error(`❌ ${this.name} failed:`, error);
      throw error;
    }
  },
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/USD`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Provider 2: Fixer.io (Plus précis, API key requise)
const fixerIoProvider: CurrencyProvider = {
  name: 'Fixer.io',
  apiKey: process.env.FIXER_API_KEY,
  baseUrl: 'http://data.fixer.io/api/latest',
  
  async fetchRates(base: string, targets: string[]): Promise<ExchangeRate[]> {
    if (!this.apiKey) throw new Error('Fixer API key not configured');
    
    try {
      const symbols = targets.join(',');
      const url = `${this.baseUrl}?access_key=${this.apiKey}&base=${base}&symbols=${symbols}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.info || 'API Error');
      
      return targets.map(target => ({
        base_currency: base,
        target_currency: target,
        rate: data.rates[target] || 1,
        date: data.date,
        source: this.name
      }));
    } catch (error) {
      console.error(`❌ ${this.name} failed:`, error);
      throw error;
    }
  },
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(`${this.baseUrl}?access_key=${this.apiKey}`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Provider 3: Backup rates (rates statiques en cas d'échec total)
const backupProvider: CurrencyProvider = {
  name: 'Backup-Static',
  baseUrl: '',
  
  async fetchRates(base: string, targets: string[]): Promise<ExchangeRate[]> {
    // Taux de change approximatifs statiques
    const staticRates: Record<string, Record<string, number>> = {
      'USD': { 'EUR': 0.85, 'CAD': 1.35, 'GBP': 0.73, 'CHF': 0.88 },
      'EUR': { 'USD': 1.18, 'CAD': 1.59, 'GBP': 0.86, 'CHF': 1.04 },
      'CAD': { 'USD': 0.74, 'EUR': 0.63, 'GBP': 0.54, 'CHF': 0.65 },
      'GBP': { 'USD': 1.37, 'EUR': 1.16, 'CAD': 1.85, 'CHF': 1.21 },
      'CHF': { 'USD': 1.14, 'EUR': 0.96, 'CAD': 1.54, 'GBP': 0.83 }
    };
    
    const today = new Date().toISOString().split('T')[0];
    return targets.map(target => ({
      base_currency: base,
      target_currency: target,
      rate: staticRates[base]?.[target] || 1,
      date: today,
      source: this.name
    }));
  },
  
  async isAvailable(): Promise<boolean> {
    return true; // Toujours disponible
  }
};

// Gestionnaire principal avec fallback automatique
class CurrencyAPIManager {
  private providers: CurrencyProvider[] = [
    fixerIoProvider,
    exchangeRateApiProvider,
    backupProvider
  ];
  
  // Devises supportées
  private supportedCurrencies = ['USD', 'EUR', 'CAD', 'GBP', 'CHF', 'JPY', 'AUD'];
  
  /**
   * Récupère les taux de change avec fallback automatique
   */
  async getExchangeRates(baseCurrency: string, targetCurrencies: string[]): Promise<ExchangeRate[]> {
    const validTargets = targetCurrencies.filter(c => 
      this.supportedCurrencies.includes(c) && c !== baseCurrency
    );
    
    if (validTargets.length === 0) {
      console.log('💡 Aucune devise cible valide');
      return [];
    }
    
    for (const provider of this.providers) {
      try {
        console.log(`🔄 Tentative avec ${provider.name}...`);
        
        if (!(await provider.isAvailable())) {
          console.log(`⚠️ ${provider.name} non disponible`);
          continue;
        }
        
        const rates = await provider.fetchRates(baseCurrency, validTargets);
        console.log(`✅ ${provider.name} réussi: ${rates.length} taux récupérés`);
        return rates;
        
      } catch (error) {
        console.log(`❌ ${provider.name} échoué:`, error);
        continue;
      }
    }
    
    throw new Error('❌ Tous les providers de devises ont échoué');
  }
  
  /**
   * Sauvegarde les taux dans Supabase
   */
  async saveRatesToDatabase(rates: ExchangeRate[]): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Préparer les données pour insertion
      const rateData = rates.map(rate => ({
        base_currency: rate.base_currency,
        target_currency: rate.target_currency,
        rate: rate.rate,
        date: rate.date,
        source: rate.source,
        created_at: new Date().toISOString()
      }));
      
      // Insérer dans la table currency_rates
      const { error } = await supabase
        .from('currency_rates')
        .upsert(rateData, {
          onConflict: 'base_currency,target_currency,date'
        });
      
      if (error) throw error;
      
      console.log(`💾 ${rates.length} taux sauvegardés en base`);
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde taux:', error);
      throw error;
    }
  }
  
  /**
   * Mise à jour automatique des taux
   */
  async updateCurrencyRates(baseCurrency: string = 'CAD'): Promise<{ success: boolean; count: number; source: string }> {
    try {
      const targetCurrencies = this.supportedCurrencies.filter(c => c !== baseCurrency);
      
      console.log(`🚀 Mise à jour taux pour ${baseCurrency} → [${targetCurrencies.join(', ')}]`);
      
      const rates = await this.getExchangeRates(baseCurrency, targetCurrencies);
      await this.saveRatesToDatabase(rates);
      
      return {
        success: true,
        count: rates.length,
        source: rates[0]?.source || 'unknown'
      };
      
    } catch (error) {
      console.error('❌ Mise à jour échec:', error);
      return {
        success: false,
        count: 0,
        source: 'error'
      };
    }
  }
  
  getSupportedCurrencies(): string[] {
    return [...this.supportedCurrencies];
  }
}

// Instance globale
export const currencyAPI = new CurrencyAPIManager();

// Helper pour conversion directe
export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<{ convertedAmount: number; rate: number; source: string }> {
  try {
    const rates = await currencyAPI.getExchangeRates(fromCurrency, [toCurrency]);
    const rate = rates.find(r => r.target_currency === toCurrency)?.rate || 1;
    
    return {
      convertedAmount: amount * rate,
      rate,
      source: rates[0]?.source || 'unknown'
    };
  } catch (error) {
    console.error('❌ Conversion échec:', error);
    return { convertedAmount: amount, rate: 1, source: 'error' };
  }
}

// Types exports
export type { ExchangeRate, CurrencyProvider };
