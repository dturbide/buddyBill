// 🪝 Hook React pour gestion des devises et conversions automatiques
import { useState, useEffect, useCallback } from 'react';

interface CurrencyConversion {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  timestamp: string;
}

interface CurrencyStatus {
  lastUpdate: string | null;
  lastSource: string | null;
  totalRates: number;
  hoursSinceUpdate: number;
  needsUpdate: boolean;
  supportedCurrencies: string[];
}

interface UpdateResult {
  success: boolean;
  message: string;
  data?: {
    baseCurrency: string;
    ratesUpdated: number;
    source: string;
    timestamp: string;
  };
}

export function useCurrency() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CurrencyStatus | null>(null);

  // Récupérer le statut des taux de change
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/currency/update');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Convertir un montant
  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<CurrencyConversion | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/currency/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, fromCurrency, toCurrency })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de conversion';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour les taux de change
  const updateRates = useCallback(async (baseCurrency: string = 'CAD'): Promise<UpdateResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/currency/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCurrency })
      });

      const result = await response.json();
      
      if (result.success) {
        // Recharger le statut après mise à jour
        await fetchStatus();
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  // Auto-mise à jour si nécessaire
  const autoUpdateIfNeeded = useCallback(async () => {
    if (status?.needsUpdate) {
      console.log('🔄 Auto-mise à jour des taux de change...');
      await updateRates();
    }
  }, [status?.needsUpdate, updateRates]);

  // Charger le statut au montage
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-mise à jour périodique (toutes les heures)
  useEffect(() => {
    const interval = setInterval(() => {
      autoUpdateIfNeeded();
    }, 60 * 60 * 1000); // 1 heure

    return () => clearInterval(interval);
  }, [autoUpdateIfNeeded]);

  return {
    // État
    loading,
    error,
    status,
    
    // Actions
    convertAmount,
    updateRates,
    fetchStatus,
    autoUpdateIfNeeded,
    
    // Helpers
    isUpToDate: status ? !status.needsUpdate : null,
    supportedCurrencies: status?.supportedCurrencies || [],
    lastUpdate: status?.lastUpdate || null
  };
}

// Hook spécialisé pour conversions en temps réel
export function useCurrencyConverter(fromCurrency: string, toCurrency: string) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const { convertAmount } = useCurrency();

  // Fonction pour convertir un montant spécifique
  const convert = useCallback(async (amount: number) => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const result = await convertAmount(amount, fromCurrency, toCurrency);
    if (result) {
      setRate(result.rate);
      setLastUpdate(result.timestamp);
      return result.convertedAmount;
    }
    return amount;
  }, [convertAmount, fromCurrency, toCurrency]);

  // Récupérer le taux de change (sans conversion)
  const fetchRate = useCallback(async () => {
    if (fromCurrency === toCurrency) {
      setRate(1);
      return 1;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/currency/convert?amount=1&from=${fromCurrency}&to=${toCurrency}`);
      const result = await response.json();
      
      if (result.success) {
        setRate(result.data.rate);
        setLastUpdate(result.data.timestamp);
        setError(null);
        return result.data.rate;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération du taux';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fromCurrency, toCurrency]);

  // Récupérer le taux au montage ou changement de devises
  useEffect(() => {
    if (fromCurrency && toCurrency) {
      fetchRate();
    }
  }, [fromCurrency, toCurrency, fetchRate]);

  return {
    rate,
    loading,
    error,
    lastUpdate,
    convert,
    fetchRate
  };
}

// Types exportés
export type { CurrencyConversion, CurrencyStatus, UpdateResult };
