"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/app-layout'
import { MobileCard } from '@/components/mobile-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { CurrencyAmountDisplay } from '@/components/currency-amount-display'
import { CurrencyConversionStatus } from '@/components/internet-status-indicator'
import { TrendingUp, TrendingDown, Users, Send, AlertCircle, Plus, History, Mail, MessageCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/components/notification-system'

interface BalancesByPerson {
  userId: string
  name: string
  balance: number
  owedToYou: number
  youOwe: number
  email: string
}

interface BalancesByGroup {
  groupId: string
  groupName: string
  balance: number
  owedToYou: number
  youOwe: number
  currency?: string // Devise du groupe (voyage)
}

interface BalancesData {
  totalOwed: number
  totalYouOwe: number
  netBalance: number
  monthExpenses: number
  activeGroups: number
  pendingTransactions: number
  balancesByPerson: BalancesByPerson[]
  balancesByGroup: BalancesByGroup[]
  userPreferredCurrency?: string // Devise de base de l'utilisateur
  groupCurrency?: string // Devise principale pour les totaux
}

export default function BalancesScreen() {
  const { t } = useTranslation()
  const [balances, setBalances] = useState<BalancesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const notifications = useNotifications()

  useEffect(() => {
    async function fetchBalances() {
      try {
        setError(null) // Reset error before new request
        const response = await fetch('/api/balances', {
          method: 'GET',
          credentials: 'include', // Important: inclure les cookies d'authentification
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!response.ok) {
          const errorData = await response.text()
          console.error('Erreur API balances:', response.status, errorData)
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const responseData = await response.json()
        console.log('Données balances reçues:', responseData)
        
        // L'API retourne { success: true, data: {...} }
        setBalances(responseData.success ? responseData.data : responseData)
      } catch (err) {
        console.error('Erreur chargement balances:', err)
        setError('Impossible de charger les balances')
        // Afficher notification d'erreur
        notifications.showError(
          'Erreur de chargement',
          'Impossible de charger les balances. Vérifiez votre connexion.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()
  }, [])

  // Fonction pour formater les devises (fallback)
  const formatCurrency = (amount: number | undefined | null, currency: string = 'EUR') => {
    const cleanAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return `${cleanAmount.toFixed(2)} ${currency}`
  }

  // Fonction élégante pour gérer les paiements par email
  const handlePaymentEmail = (personName: string, personEmail: string, amount: number, isOwedToYou: boolean) => {
    // Vérifier si l'email est disponible et réel
    if (!personEmail || personEmail.includes('@buddybill.local') || personEmail.includes('@example.com')) {
      // Utiliser le système de notifications élégant au lieu d'un alert basique
      notifications.showConfirmation({
        title: '📧 Email de démonstration',
        message: `${personName} utilise une adresse email de démonstration.
        
🏷️ Montant à régler : ${formatCurrency(amount, balances?.groupCurrency || 'EUR')}

💡 En production, vous pourriez :
• Envoyer un email automatique à l'adresse réelle
• Utiliser une notification push dans l'app
• Contacter ${personName} directement

🎯 Pour cette démo, nous simulerons l'envoi !`,
        confirmText: '📧 Simuler l\'envoi',
        cancelText: 'Annuler',
        type: 'info',
        onConfirm: () => {
          notifications.showSuccess(
            '✅ Email simulé envoyé !', 
            `Le message de paiement pour ${personName} (${formatCurrency(amount, balances?.groupCurrency || 'EUR')}) a été simulé avec succès. En production, un vrai email serait envoyé !`
          )
        }
      })
      return
    }

    // Email réel disponible - procéder à l'envoi
    const subject = encodeURIComponent(`💰 Paiement BuddyBill - ${formatCurrency(amount, balances?.groupCurrency || 'EUR')}`)
    
    const bodyMessage = isOwedToYou 
      ? `Salut ${personName} ! 👋

J'espère que tu vas bien ! 

D'après nos comptes sur BuddyBill, tu me dois ${formatCurrency(amount, balances?.groupCurrency || 'EUR')}. 📊

Peux-tu me faire le virement quand tu auras un moment ? 🏦

Merci beaucoup ! 🙏

À bientôt ! ✨`
      : `Salut ${personName} ! 👋

J'espère que tu vas bien !

D'après nos comptes sur BuddyBill, je te dois ${formatCurrency(amount, balances?.groupCurrency || 'EUR')}. 📊

Je vais te faire le virement très bientôt ! Peux-tu me confirmer tes coordonnées bancaires ? 🏦

Merci et à bientôt ! ✨`

    const body = encodeURIComponent(bodyMessage)
    const mailtoLink = `mailto:${personEmail}?subject=${subject}&body=${body}`
    
    // Ouvrir le client email
    try {
      window.location.href = mailtoLink
      notifications.showSuccess(
        '📧 Email préparé !', 
        `Le message de paiement pour ${personName} a été ouvert dans votre client email.`
      )
    } catch (error) {
      console.error('Erreur ouverture client email:', error)
      notifications.showError(
        '❌ Erreur email',
        'Impossible d\'ouvrir le client email. Vérifiez qu\'un client email est configuré sur votre appareil.'
      )
    }
  }

  if (loading) {
    return (
      <AppLayout title="Équilibres">
        <div className="space-y-4 p-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Équilibres">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </AppLayout>
    )
  }

  if (!balances) {
    return (
      <AppLayout title="Équilibres">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée</h3>
          <p className="text-muted-foreground">Impossible de charger les balances</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Équilibres">
      <div className="space-y-4 p-4">
        {/* Indicateur de statut de connexion pour les conversions */}
        <CurrencyConversionStatus className="mb-2" />
        
        {/* Résumé global */}
        {balances && (
          <MobileCard>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Résumé global</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-gray-600">On vous doit</span>
                  </div>
                  <CurrencyAmountDisplay 
                    amount={balances.totalOwed} 
                    currency={balances.groupCurrency || 'EUR'} 
                    userPreferredCurrency={balances.userPreferredCurrency || 'CAD'}
                    showConversion={true}
                  />
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-sm text-gray-600">Vous devez</span>
                  </div>
                  <CurrencyAmountDisplay 
                    amount={balances.totalYouOwe} 
                    currency={balances.groupCurrency || 'EUR'} 
                    userPreferredCurrency={balances.userPreferredCurrency || 'CAD'}
                    showConversion={true}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-center">
                  <span className="text-sm text-gray-600">Balance nette</span>
                  <CurrencyAmountDisplay 
                    amount={balances.netBalance} 
                    currency={balances.groupCurrency || 'EUR'} 
                    userPreferredCurrency={balances.userPreferredCurrency || 'CAD'}
                    showConversion={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
                <div>
                  <div className="text-sm text-gray-600">Groupes actifs</div>
                  <div className="font-semibold">{balances.activeGroups}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Transactions</div>
                  <div className="font-semibold">{balances.pendingTransactions}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ce mois</div>
                  <CurrencyAmountDisplay 
                    amount={balances.monthExpenses} 
                    currency={balances.groupCurrency || 'EUR'} 
                    userPreferredCurrency={balances.userPreferredCurrency || 'CAD'}
                    showConversion={true}
                  />
                </div>
              </div>
            </div>
          </MobileCard>
        )}

        {/* Action rapide */}
        <div className="flex gap-2">
          <Link href="/dashboard/payments/add" className="flex-1">
            <Button className="w-full" variant="default">
              <Send className="w-4 h-4 mr-2" />
              Enregistrer un paiement
            </Button>
          </Link>
          <Link href="/dashboard/payments">
            <Button variant="outline">
              <History className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Balances par personne */}
        {balances && balances.balancesByPerson && balances.balancesByPerson.length > 0 && (
          <MobileCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Balances par personne</h3>
              <div className="space-y-3">
                {balances.balancesByPerson.map((person) => (
                  <div key={person.userId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                        <AvatarFallback>
                          {person.name ? person.name.substring(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{person.name || 'Utilisateur'}</div>
                        {person.balance > 0 ? (
                          <div className="text-sm text-green-600">Vous doit</div>
                        ) : (
                          <div className="text-sm text-red-600">Vous lui devez</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <CurrencyAmountDisplay 
                        amount={Math.abs(person.balance || 0)} 
                        currency={balances.groupCurrency || 'EUR'} 
                        userPreferredCurrency={balances.userPreferredCurrency || 'CAD'}
                        showConversion={true}
                      />
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-1"
                        onClick={() => handlePaymentEmail(
                          person.name || 'Utilisateur',
                          person.email || '',
                          Math.abs(person.balance || 0),
                          (person.balance || 0) > 0
                        )}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Régler
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MobileCard>
        )}

        {/* Balances par groupe */}
        {balances && balances.balancesByGroup && balances.balancesByGroup.length > 0 && (
          <MobileCard>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Balances par groupe</h3>
              <div className="space-y-3">
                {balances.balancesByGroup.map((group) => (
                  <div key={group.groupId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{group.groupName}</div>
                        <div className="text-sm text-muted-foreground">Groupe</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <CurrencyAmountDisplay 
                        amount={Math.abs(group.balance || 0)} 
                        currency={group.currency || balances.groupCurrency || 'EUR'} 
                        userPreferredCurrency={balances.userPreferredCurrency || 'CAD'}
                        showConversion={true}
                      />
                      
                      <Link href={`/dashboard/groups/${group.groupId}`}>
                        <Button size="sm" variant="outline" className="mt-1">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MobileCard>
        )}

        {/* État vide */}
        {balances && balances.balancesByPerson && balances.balancesByGroup && 
         balances.balancesByPerson.length === 0 && balances.balancesByGroup.length === 0 && (
          <MobileCard>
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Toutes les balances sont équilibrées !</h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez aucune dette en cours et personne ne vous doit d'argent.
              </p>
              <Link href="/dashboard/expenses/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une dépense
                </Button>
              </Link>
            </div>
          </MobileCard>
        )}
      </div>
    </AppLayout>
  )
}
