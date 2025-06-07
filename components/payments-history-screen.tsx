"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/app-layout'
import { MobileCard } from '@/components/mobile-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, ArrowDownLeft, Calendar, Plus, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Payment {
  id: string
  group_id: string | null
  payer_id: string
  payee_id: string
  amount: number
  currency: string
  description: string | null
  status: string
  payment_date: string
  created_at: string
  payer: {
    id: string
    full_name: string
  }
  payee: {
    id: string
    full_name: string
  }
}

export default function PaymentsHistoryScreen() {
  const { t } = useTranslation()
  
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/payments')
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Erreur chargement paiements')
        }

        if (result.success) {
          setPayments(result.data || [])
        } else {
          throw new Error(result.error || 'Erreur API')
        }

      } catch (err) {
        console.error('Erreur chargement paiements:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  const formatPaymentDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'PPP', { locale: fr })
    } catch (error) {
      return dateString
    }
  }

  const getPaymentIcon = (payment: Payment, currentUserId?: string) => {
    if (payment.payer_id === currentUserId) {
      return <ArrowUpRight className="w-4 h-4 text-red-500" />
    } else {
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />
    }
  }

  const getPaymentType = (payment: Payment, currentUserId?: string) => {
    if (payment.payer_id === currentUserId) {
      return { type: 'sent', text: 'Envoyé à', color: 'text-red-600' }
    } else {
      return { type: 'received', text: 'Reçu de', color: 'text-green-600' }
    }
  }

  const getOtherUser = (payment: Payment, currentUserId?: string) => {
    if (payment.payer_id === currentUserId) {
      return payment.payee
    } else {
      return payment.payer
    }
  }

  if (loading) {
    return (
      <AppLayout title="Historique des paiements" showBackButton backHref="/dashboard/settle-up">
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MobileCard key={i}>
              <div className="p-4 flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </MobileCard>
          ))}
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title="Historique des paiements" showBackButton backHref="/dashboard/settle-up">
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

  if (payments.length === 0) {
    return (
      <AppLayout title="Historique des paiements" showBackButton backHref="/dashboard/settle-up">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
          <p className="text-muted-foreground mb-6">
            Vous n'avez encore effectué ou reçu aucun paiement.
          </p>
          <Link href="/dashboard/payments/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Enregistrer un paiement
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Historique des paiements" showBackButton backHref="/dashboard/settle-up">
      <div className="space-y-4 p-4">
        
        {/* Bouton d'ajout rapide */}
        <div className="flex justify-end">
          <Link href="/dashboard/payments/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau paiement
            </Button>
          </Link>
        </div>

        {/* Liste des paiements */}
        <div className="space-y-3">
          {payments.map((payment) => {
            const otherUser = getOtherUser(payment)
            const paymentType = getPaymentType(payment)
            
            return (
              <MobileCard key={payment.id}>
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    
                    {/* Icône et direction */}
                    <div className="flex-shrink-0">
                      {getPaymentIcon(payment)}
                    </div>

                    {/* Avatar utilisateur */}
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {otherUser.full_name?.substring(0, 1) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Informations principales */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">
                          {paymentType.text} {otherUser.full_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatPaymentDate(payment.payment_date)}
                        </span>
                      </div>
                      
                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {payment.description}
                        </p>
                      )}
                    </div>

                    {/* Montant */}
                    <div className="text-right flex-shrink-0">
                      <div className={`font-semibold ${paymentType.color}`}>
                        {paymentType.type === 'sent' ? '-' : '+'}
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.currency}
                      </div>
                    </div>
                  </div>
                </div>
              </MobileCard>
            )
          })}
        </div>

        {/* Message de fin */}
        {payments.length > 0 && (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">
              {payments.length} paiement{payments.length > 1 ? 's' : ''} affiché{payments.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
