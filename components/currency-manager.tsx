'use client';

// 💱 Composant de gestion des devises avec mise à jour automatique
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';
import { useCurrency, useCurrencyConverter } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';

interface CurrencyManagerProps {
  className?: string;
  showConverter?: boolean;
  baseCurrency?: string;
}

export function CurrencyManager({ 
  className = '', 
  showConverter = true,
  baseCurrency = 'CAD' 
}: CurrencyManagerProps) {
  const {
    loading,
    error,
    status,
    updateRates,
    isUpToDate,
    supportedCurrencies
  } = useCurrency();

  const [updateLoading, setUpdateLoading] = useState(false);

  const handleUpdate = async () => {
    setUpdateLoading(true);
    try {
      const result = await updateRates(baseCurrency);
      console.log('🔄 Mise à jour:', result.success ? result.message : result.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    if (isUpToDate) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          À jour
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Mise à jour requise
        </Badge>
      );
    }
  };

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Jamais';
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Gestion des Devises
            </CardTitle>
            <CardDescription>
              Taux de change automatiques avec {supportedCurrencies.length} devises supportées
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statut actuel */}
        {status && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Dernière mise à jour</p>
              <p className="font-medium">{formatLastUpdate(status.lastUpdate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Source</p>
              <p className="font-medium">{status.lastSource || 'Aucune'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Taux disponibles</p>
              <p className="font-medium">{status.totalRates} taux</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fraîcheur</p>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <p className="font-medium">{status.hoursSinceUpdate}h</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdate}
            disabled={loading || updateLoading}
            size="sm"
            variant={isUpToDate ? "outline" : "default"}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loading || updateLoading) ? 'animate-spin' : ''}`} />
            {updateLoading ? 'Mise à jour...' : 'Actualiser les taux'}
          </Button>
        </div>

        {/* Devises supportées */}
        {supportedCurrencies.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Devises supportées</p>
              <div className="flex flex-wrap gap-1">
                {supportedCurrencies.map(currency => (
                  <Badge key={currency} variant="secondary" className="text-xs">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Convertisseur rapide */}
        {showConverter && (
          <>
            <Separator />
            <QuickConverter baseCurrency={baseCurrency} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Composant convertisseur rapide
function QuickConverter({ baseCurrency }: { baseCurrency: string }) {
  const [amount, setAmount] = useState('100');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [result, setResult] = useState<number | null>(null);

  const { convert, loading, rate } = useCurrencyConverter(baseCurrency, targetCurrency);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    const converted = await convert(numAmount);
    setResult(converted);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Convertisseur rapide</p>
      
      <div className="grid grid-cols-4 gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Montant</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder="100"
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <div className="px-2 py-1 text-sm border rounded bg-muted">
            {baseCurrency}
          </div>
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground">Vers</label>
          <select
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="CHF">CHF</option>
            <option value="JPY">JPY</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
        
        <Button
          onClick={handleConvert}
          disabled={loading}
          size="sm"
          className="h-8"
        >
          {loading ? '...' : '='}
        </Button>
      </div>

      {/* Résultat */}
      {result !== null && rate && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">{amount} {baseCurrency}</span>
              {' = '}
              <span className="font-bold text-green-600">
                {formatCurrency(result, targetCurrency)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Taux: 1 {baseCurrency} = {rate.toFixed(4)} {targetCurrency}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
