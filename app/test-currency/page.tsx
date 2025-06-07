'use client';

// 🧪 Page de test pour l'intégration des API de devises
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CurrencyManager } from '@/components/currency-manager';
import { CurrencyAmountDisplay, CurrencyAmountList } from '@/components/currency-amount-display';
import { useCurrency } from '@/hooks/use-currency';

export default function TestCurrencyPage() {
  const [testAmount, setTestAmount] = useState('150.00');
  const [testCurrency, setTestCurrency] = useState('USD');
  const [userPreferredCurrency, setUserPreferredCurrency] = useState('EUR');

  const { updateRates, loading } = useCurrency();

  // Données de test pour la liste
  const testItems = [
    { amount: 100, currency: 'USD', label: 'Dépense restaurant' },
    { amount: 75, currency: 'EUR', label: 'Transport taxi' },
    { amount: 200, currency: 'CAD', label: 'Hébergement hotel' },
    { amount: 50, currency: 'GBP', label: 'Shopping souvenir' }
  ];

  const handleTestUpdate = async () => {
    await updateRates('CAD');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Titre */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🧪 Test d'Intégration Devises</h1>
        <p className="text-muted-foreground">
          Interface de test pour vérifier le fonctionnement des API de conversion automatique
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestionnaire de devises */}
        <CurrencyManager 
          showConverter={true}
          baseCurrency="CAD"
        />

        {/* Test d'affichage de montant unique */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Test Affichage Montant</CardTitle>
            <CardDescription>
              Test du composant CurrencyAmountDisplay avec conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="150.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise originale</Label>
                <select
                  id="currency"
                  value={testCurrency}
                  onChange={(e) => setTestCurrency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CAD">CAD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="preferred">Devise préférée utilisateur</Label>
              <select
                id="preferred"
                value={userPreferredCurrency}
                onChange={(e) => setUserPreferredCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </div>

            <Separator />

            {/* Résultats d'affichage */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Taille Small:</p>
                <CurrencyAmountDisplay
                  amount={parseFloat(testAmount) || 0}
                  currency={testCurrency}
                  userPreferredCurrency={userPreferredCurrency}
                  size="sm"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Taille Medium:</p>
                <CurrencyAmountDisplay
                  amount={parseFloat(testAmount) || 0}
                  currency={testCurrency}
                  userPreferredCurrency={userPreferredCurrency}
                  size="md"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Taille Large:</p>
                <CurrencyAmountDisplay
                  amount={parseFloat(testAmount) || 0}
                  currency={testCurrency}
                  userPreferredCurrency={userPreferredCurrency}
                  size="lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test de liste avec totaux */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📋 Test Liste Multi-Devises</CardTitle>
            <CardDescription>
              Test du composant CurrencyAmountList avec conversion et totaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyAmountList
              items={testItems}
              userPreferredCurrency={userPreferredCurrency}
              showTotal={true}
            />
          </CardContent>
        </Card>

        {/* Tests API directs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>🔌 Tests API Directs</CardTitle>
            <CardDescription>
              Tester les endpoints d'API directement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={handleTestUpdate} disabled={loading}>
                🔄 Test Mise à Jour Taux
              </Button>
              
              <Button 
                onClick={() => testConversion()}
                variant="outline"
              >
                💱 Test Conversion 100 USD→EUR
              </Button>
              
              <Button 
                onClick={() => testStatus()}
                variant="outline"
              >
                📊 Test Statut Taux
              </Button>
            </div>

            <div id="test-results" className="min-h-[100px] p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Les résultats des tests s'afficheront ici...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Fonctions de test des API
async function testConversion() {
  try {
    const response = await fetch('/api/currency/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' })
    });
    const result = await response.json();
    
    displayTestResult('Conversion 100 USD→EUR', result);
  } catch (error) {
    displayTestResult('Conversion Error', { error: error });
  }
}

async function testStatus() {
  try {
    const response = await fetch('/api/currency/update');
    const result = await response.json();
    
    displayTestResult('Statut des taux', result);
  } catch (error) {
    displayTestResult('Status Error', { error: error });
  }
}

function displayTestResult(title: string, result: any) {
  const resultsDiv = document.getElementById('test-results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `
      <div class="space-y-2">
        <h4 class="font-medium">${title}</h4>
        <pre class="text-xs bg-background p-2 rounded border overflow-auto">${JSON.stringify(result, null, 2)}</pre>
      </div>
    `;
  }
}
