'use client';

// 💰 Composant pour affichage de montants avec conversion automatique
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/use-currency';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

interface CurrencyAmountDisplayProps {
  amount: number;
  currency: string;
  userPreferredCurrency?: string;
  showConversion?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CurrencyAmountDisplay({
  amount,
  currency,
  userPreferredCurrency,
  showConversion = true,
  size = 'md',
  className = ''
}: CurrencyAmountDisplayProps) {
  const [isConverted, setIsConverted] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const shouldShowConversion = showConversion && 
    userPreferredCurrency && 
    currency !== userPreferredCurrency;

  const { convert, loading, rate } = useCurrencyConverter(
    currency,
    userPreferredCurrency || currency
  );

  // Conversion automatique au chargement
  useEffect(() => {
    if (shouldShowConversion && !isConverted) {
      handleConvert();
    }
  }, [shouldShowConversion]);

  const handleConvert = async () => {
    if (!userPreferredCurrency || currency === userPreferredCurrency) return;
    
    const result = await convert(amount);
    setConvertedAmount(result);
    setIsConverted(true);
  };

  const toggleConversion = () => {
    if (!shouldShowConversion) return;
    
    if (!isConverted) {
      handleConvert();
    } else {
      setIsConverted(!isConverted);
    }
  };

  // Styles selon la taille
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  const badgeSize = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };

  // Montant à afficher
  const displayAmount = isConverted && convertedAmount !== null ? convertedAmount : amount;
  const displayCurrency = isConverted ? userPreferredCurrency! : currency;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Montant principal */}
      <span className={`font-medium ${sizeClasses[size]}`}>
        {formatCurrency(displayAmount, displayCurrency)}
      </span>

      {/* Badge de devise avec conversion */}
      {shouldShowConversion && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 py-0"
                onClick={toggleConversion}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className={badgeSize[size]}>
                      {isConverted ? userPreferredCurrency : currency}
                    </span>
                    <ArrowRightLeft className="w-3 h-3" />
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>
                  {isConverted 
                    ? `Original: ${formatCurrency(amount, currency)}`
                    : `Convertir vers ${userPreferredCurrency}`
                  }
                </p>
                {rate && (
                  <p className="text-muted-foreground">
                    Taux: 1 {currency} = {rate.toFixed(4)} {userPreferredCurrency}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Badge simple si pas de conversion */}
      {!shouldShowConversion && (
        <Badge variant="secondary" className={badgeSize[size]}>
          {currency}
        </Badge>
      )}
    </div>
  );
}

// 📋 Composant pour listes de montants avec totaux convertis
interface CurrencyAmountListProps {
  items: Array<{ amount: number; currency: string; label?: string }>;
  userPreferredCurrency?: string;
  showTotal?: boolean;
  className?: string;
}

export function CurrencyAmountList({
  items,
  userPreferredCurrency,
  showTotal = true,
  className = ''
}: CurrencyAmountListProps) {
  const [convertedItems, setConvertedItems] = useState<Array<{ 
    amount: number; 
    convertedAmount: number; 
    currency: string; 
    label?: string 
  }>>([]);
  const [loading, setLoading] = useState(false);

  // Conversion de tous les éléments
  useEffect(() => {
    if (!userPreferredCurrency) return;

    const convertAllItems = async () => {
      setLoading(true);
      const converted = [];

      for (const item of items) {
        if (item.currency === userPreferredCurrency) {
          converted.push({
            ...item,
            convertedAmount: item.amount
          });
        } else {
          // Ici on pourrait utiliser l'API de conversion
          // Pour simplifier, on utilise un taux fixe pour la démo
          const rate = await fetchConversionRate(item.currency, userPreferredCurrency);
          converted.push({
            ...item,
            convertedAmount: item.amount * rate
          });
        }
      }

      setConvertedItems(converted);
      setLoading(false);
    };

    convertAllItems();
  }, [items, userPreferredCurrency]);

  // Helper pour récupérer un taux de conversion (mockée)
  const fetchConversionRate = async (from: string, to: string): Promise<number> => {
    try {
      const response = await fetch(`/api/currency/convert?amount=1&from=${from}&to=${to}`);
      const result = await response.json();
      return result.success ? result.data.rate : 1;
    } catch {
      return 1;
    }
  };

  const total = convertedItems.reduce((sum, item) => sum + item.convertedAmount, 0);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Conversion en cours...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Liste des éléments */}
      {convertedItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm">{item.label || `Élément ${index + 1}`}</span>
          <CurrencyAmountDisplay
            amount={item.amount}
            currency={item.currency}
            userPreferredCurrency={userPreferredCurrency}
            size="sm"
          />
        </div>
      ))}

      {/* Total */}
      {showTotal && convertedItems.length > 1 && (
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between items-center font-semibold">
            <span>Total</span>
            <span>
              {formatCurrency(total, userPreferredCurrency || 'EUR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
