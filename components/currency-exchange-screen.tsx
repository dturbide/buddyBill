"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingUp, TrendingDown, RefreshCw, Bell, Calculator, Plane, ArrowLeftRight } from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import { ALL_CURRENCIES, getCurrencyByCode, formatCurrencyAmount, POPULAR_CURRENCIES } from '@/lib/currencies'

// Interface pour les taux de change
interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
}

// Interface pour les montants dans le groupe
interface CurrencyBalance {
  currency: string
  amount: number
  isOwed: boolean // true si on me doit de l'argent, false si je dois
}

export default function CurrencyExchangeScreen() {
  // États pour les devises
  const [travelCurrency, setTravelCurrency] = useState('JPY') // Devise du pays visité
  const [homeCurrency, setHomeCurrency] = useState('CAD') // Devise de base utilisateur
  const [searchTravel, setSearchTravel] = useState('')
  const [searchHome, setSearchHome] = useState('')
  
  // États pour les montants et conversions
  const [amount, setAmount] = useState('100')
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  
  // Balances fictives pour la démo (en réalité viendrait de Supabase)
  const [groupBalances] = useState<CurrencyBalance[]>([
    { currency: 'JPY', amount: 15000, isOwed: false }, // Je dois 15,000 yen
    { currency: 'USD', amount: 250, isOwed: true },    // On me doit 250 USD
    { currency: 'EUR', amount: 80, isOwed: false },    // Je dois 80 EUR
  ])

  // Simuler API taux de change (en réalité utiliserait exchangerate-api.com)
  const fetchExchangeRate = async (from: string, to: string) => {
    setIsLoading(true)
    try {
      // Simulation d'API - en réalité faire appel à une vraie API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Taux fictifs pour la démo
      const mockRates: { [key: string]: number } = {
        'JPY_CAD': 0.0089,
        'CAD_JPY': 112.36,
        'USD_CAD': 1.34,
        'CAD_USD': 0.75,
        'EUR_CAD': 1.45,
        'CAD_EUR': 0.69,
        'JPY_USD': 0.0067,
        'USD_JPY': 149.50,
      }
      
      const rateKey = `${from}_${to}`
      const rate = mockRates[rateKey] || 1
      
      setExchangeRate({
        from,
        to,
        rate,
        lastUpdated: new Date().toISOString(),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'))
    } catch (error) {
      console.error('Erreur récupération taux:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Effet pour récupérer le taux quand les devises changent
  useEffect(() => {
    if (travelCurrency && homeCurrency && travelCurrency !== homeCurrency) {
      fetchExchangeRate(travelCurrency, homeCurrency)
    }
  }, [travelCurrency, homeCurrency])

  // Filtrage des devises
  const filteredTravelCurrencies = ALL_CURRENCIES.filter((curr) =>
    curr.code.toLowerCase().includes(searchTravel.toLowerCase()) ||
    curr.name.toLowerCase().includes(searchTravel.toLowerCase())
  )

  const filteredHomeCurrencies = ALL_CURRENCIES.filter((curr) =>
    curr.code.toLowerCase().includes(searchHome.toLowerCase()) ||
    curr.name.toLowerCase().includes(searchHome.toLowerCase())
  )

  // Calculer la conversion
  const convertedAmount = exchangeRate ? (parseFloat(amount || '0') * exchangeRate.rate) : 0

  // Calculer les équivalences pour les balances du groupe
  const getConvertedBalance = (balance: CurrencyBalance) => {
    if (balance.currency === homeCurrency) return balance.amount
    
    // Simulation de conversion (en réalité utiliserait des taux réels)
    const mockConversions: { [key: string]: number } = {
      'JPY': 0.0089, // JPY vers CAD
      'USD': 1.34,   // USD vers CAD  
      'EUR': 1.45,   // EUR vers CAD
    }
    
    return balance.amount * (mockConversions[balance.currency] || 1)
  }

  return (
    <AppLayout title="Conversion Devises" showBackButton={true} backHref="/dashboard">
      <div className="p-4 space-y-6 max-w-md mx-auto">
        
        {/* En-tête avec icône voyage */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <Plane className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold">Conversion Voyage</h1>
          <p className="text-sm text-muted-foreground">
            Convertissez vos dépenses entre devises
          </p>
        </div>

        {/* Sélecteurs de devises */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Devises de Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Devise de voyage (pays visité) */}
            <div className="space-y-2">
              <Label>Devise de voyage (pays visité)</Label>
              <div className="space-y-1">
                <Input
                  placeholder="Rechercher devise voyage..."
                  value={searchTravel}
                  onChange={(e) => setSearchTravel(e.target.value)}
                  className="text-sm h-8"
                />
                <Select value={travelCurrency} onValueChange={setTravelCurrency}>
                  <SelectTrigger>
                    <SelectValue>
                      {getCurrencyByCode(travelCurrency)?.flag} {getCurrencyByCode(travelCurrency)?.name} ({travelCurrency})
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    {filteredTravelCurrencies.slice(0, 30).map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <span className="flex items-center gap-2">
                          <span>{curr.flag}</span>
                          <span>{curr.name}</span>
                          <span className="text-muted-foreground">({curr.code})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Devise de base (maison) */}
            <div className="space-y-2">
              <Label>Devise de base (votre pays)</Label>
              <div className="space-y-1">
                <Input
                  placeholder="Rechercher devise base..."
                  value={searchHome}
                  onChange={(e) => setSearchHome(e.target.value)}
                  className="text-sm h-8"
                />
                <Select value={homeCurrency} onValueChange={setHomeCurrency}>
                  <SelectTrigger>
                    <SelectValue>
                      {getCurrencyByCode(homeCurrency)?.flag} {getCurrencyByCode(homeCurrency)?.name} ({homeCurrency})
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    {filteredHomeCurrencies.slice(0, 30).map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <span className="flex items-center gap-2">
                          <span>{curr.flag}</span>
                          <span>{curr.name}</span>
                          <span className="text-muted-foreground">({curr.code})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taux de change actuel */}
        {exchangeRate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                Taux de Change
                {exchangeRate.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                {exchangeRate.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">
                  1 {exchangeRate.from} = {exchangeRate.rate.toFixed(4)} {exchangeRate.to}
                </div>
                <p className="text-sm text-muted-foreground">
                  Dernière mise à jour: {lastUpdate}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchExchangeRate(travelCurrency, homeCurrency)}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calculatrice de conversion */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculatrice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Montant à convertir</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  className="flex-1"
                />
                <Badge variant="outline" className="px-3 py-2">
                  {getCurrencyByCode(travelCurrency)?.flag} {travelCurrency}
                </Badge>
              </div>
            </div>
            
            {exchangeRate && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Équivaut à:</span>
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrencyAmount(convertedAmount, homeCurrency)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balances du groupe dans différentes devises */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Balances Groupes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vos montants dus/à recevoir dans vos groupes
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupBalances.map((balance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>{getCurrencyByCode(balance.currency)?.flag}</span>
                  <span className="font-medium">{balance.currency}</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${balance.isOwed ? 'text-green-600' : 'text-red-600'}`}>
                    {balance.isOwed ? '+' : '-'}{formatCurrencyAmount(Math.abs(balance.amount), balance.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ≈ {formatCurrencyAmount(Math.abs(getConvertedBalance(balance)), homeCurrency)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total net */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between font-bold">
                <span>Total net ({homeCurrency})</span>
                <span className={`text-lg ${
                  groupBalances.reduce((sum, b) => sum + (b.isOwed ? getConvertedBalance(b) : -getConvertedBalance(b)), 0) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrencyAmount(
                    groupBalances.reduce((sum, b) => sum + (b.isOwed ? getConvertedBalance(b) : -getConvertedBalance(b)), 0),
                    homeCurrency
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12">
            <Bell className="h-4 w-4 mr-2" />
            Alerte Taux
          </Button>
          <Button className="h-12">
            <ArrowRight className="h-4 w-4 mr-2" />
            Nouvelle Dépense
          </Button>
        </div>

      </div>
    </AppLayout>
  )
}
