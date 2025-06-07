'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  ChevronRight, 
  Shield, 
  Fingerprint, 
  Bell, 
  Globe, 
  Palette, 
  LogOut,
  User,
  CreditCard,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBiometricAuth } from '@/hooks/use-biometric-auth'

export default function ParametresPage() {
  const router = useRouter()
  const supabase = createClient()
  const { isSupported: isBiometricSupported, hasCredentials } = useBiometricAuth()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/signin')
    }
  }

  const settingsGroups = [
    {
      title: 'Sécurité',
      items: [
        {
          icon: Shield,
          label: 'Authentification Biométrique',
          description: hasCredentials ? 'Configurée' : 'Non configurée',
          href: '/dashboard/parametres/biometrique',
          show: isBiometricSupported,
          badge: hasCredentials ? 'Activé' : 'Configurer'
        },
        {
          icon: User,
          label: 'Changer le mot de passe',
          description: 'Modifier votre mot de passe actuel',
          onClick: () => alert('Fonctionnalité à venir')
        }
      ]
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Gérer vos notifications',
          onClick: () => alert('Fonctionnalité à venir')
        },
        {
          icon: Globe,
          label: 'Devise par défaut',
          description: 'EUR - Euro',
          onClick: () => alert('Fonctionnalité à venir')
        },
        {
          icon: Palette,
          label: 'Thème',
          description: 'Clair',
          onClick: () => alert('Fonctionnalité à venir')
        }
      ]
    },
    {
      title: 'Compte',
      items: [
        {
          icon: CreditCard,
          label: 'Abonnement',
          description: 'Gratuit',
          onClick: () => alert('Fonctionnalité à venir')
        },
        {
          icon: HelpCircle,
          label: 'Aide & Support',
          description: 'Centre d'aide',
          onClick: () => alert('Fonctionnalité à venir')
        }
      ]
    }
  ]

  const SettingItem = ({ item }: { item: any }) => {
    const content = (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <item.icon className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{item.label}</span>
              {item.badge && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.badge === 'Activé' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    )

    if (item.href) {
      return <Link href={item.href}>{content}</Link>
    }

    return (
      <button onClick={item.onClick} className="w-full text-left">
        {content}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Paramètres
              </h1>
              <p className="text-sm text-gray-600">
                Gérez votre compte et préférences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {group.items.map((item, itemIndex) => {
                  // Si l'item a une condition show et qu'elle est false, ne pas afficher
                  if (item.show === false) return null
                  
                  return (
                    <div key={itemIndex} className={itemIndex > 0 ? 'border-t border-gray-100' : ''}>
                      <SettingItem item={item} />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Section déconnexion */}
        <Card>
          <CardContent className="p-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Se déconnecter</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        {/* Version de l'app */}
        <div className="text-center text-sm text-gray-500">
          BuddyBill v2.1.0
        </div>
      </div>
    </div>
  )
}
