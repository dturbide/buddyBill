'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Book, 
  Smartphone, 
  WifiOff, 
  Users, 
  DollarSign, 
  Settings, 
  AlertCircle, 
  Mail,
  Search,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  Info
} from 'lucide-react'
import { AppLayout, MobileCard } from '@/components/app-layout'
import { useRouter } from 'next/navigation'

interface HelpSection {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

interface Language {
  code: 'fr' | 'en'
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

export default function HelpGuideScreen() {
  const router = useRouter()
  const [currentLang, setCurrentLang] = useState<'fr' | 'en'>('fr')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const helpSections: Record<'fr' | 'en', HelpSection[]> = {
    fr: [
      {
        id: 'overview',
        title: 'Vue d\'ensemble',
        icon: Book,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Qu'est-ce que BuddyBill ?</h3>
            <p className="text-gray-700">BuddyBill est une application de partage de dépenses qui vous permet de gérer facilement les frais partagés avec vos amis, famille ou collègues.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">✨ Fonctionnalités principales :</h4>
              <ul className="space-y-1 text-sm">
                <li>• Créer des groupes et inviter des membres</li>
                <li>• Ajouter des dépenses et les partager équitablement</li>
                <li>• Suivre qui doit quoi à qui</li>
                <li>• Fonctionnement hors-ligne complet</li>
                <li>• Support multi-devises</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'getting-started',
        title: 'Démarrage rapide',
        icon: Smartphone,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Premiers pas</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Créer votre profil</h4>
                  <p className="text-sm text-gray-600">Configurez votre nom, photo et devise préférée dans les paramètres.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Créer un groupe</h4>
                  <p className="text-sm text-gray-600">Allez sur "Groupes" → "+" pour créer un nouveau groupe et inviter des membres.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Ajouter une dépense</h4>
                  <p className="text-sm text-gray-600">Tapez "+" dans un groupe pour ajouter une dépense et choisir qui participe.</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'offline',
        title: 'Mode hors-ligne',
        icon: WifiOff,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Fonctionnement offline</h3>
            <p className="text-gray-700">BuddyBill fonctionne parfaitement même sans connexion internet !</p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-800">🔋 Fonctionnalités offline :</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✅ Consulter vos groupes et dépenses</li>
                <li>✅ Créer de nouvelles dépenses</li>
                <li>✅ Modifier des dépenses existantes</li>
                <li>✅ Voir les soldes et balances</li>
                <li>✅ Utiliser la calculatrice</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-800">🔄 Synchronisation :</h4>
              <p className="text-sm text-yellow-700">Toutes vos actions offline sont automatiquement synchronisées dès que vous retrouvez une connexion.</p>
            </div>
          </div>
        )
      },
      {
        id: 'troubleshooting',
        title: 'FAQ & Problèmes',
        icon: AlertCircle,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Questions fréquentes</h3>
            
            <div className="space-y-3">
              <details className="border rounded-lg p-3">
                <summary className="font-semibold cursor-pointer">❓ Comment inviter quelqu'un dans un groupe ?</summary>
                <p className="mt-2 text-sm text-gray-600">Allez dans le groupe → Paramètres → Membres → "Inviter" et partagez le lien ou code.</p>
              </details>
              
              <details className="border rounded-lg p-3">
                <summary className="font-semibold cursor-pointer">❓ Pourquoi mes données ne se synchronisent pas ?</summary>
                <p className="mt-2 text-sm text-gray-600">Vérifiez votre connexion internet. Les conflits peuvent nécessiter une résolution manuelle dans les paramètres.</p>
              </details>
              
              <details className="border rounded-lg p-3">
                <summary className="font-semibold cursor-pointer">❓ Comment changer ma devise par défaut ?</summary>
                <p className="mt-2 text-sm text-gray-600">Profil → Paramètres → Devise préférée → Sélectionner votre devise.</p>
              </details>
            </div>
          </div>
        )
      }
    ],
    en: [
      {
        id: 'overview',
        title: 'Overview',
        icon: Book,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What is BuddyBill?</h3>
            <p className="text-gray-700">BuddyBill is an expense sharing app that lets you easily manage shared costs with friends, family or colleagues.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">✨ Key features:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Create groups and invite members</li>
                <li>• Add expenses and split them fairly</li>
                <li>• Track who owes what to whom</li>
                <li>• Full offline functionality</li>
                <li>• Multi-currency support</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Smartphone,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">First steps</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Set up your profile</h4>
                  <p className="text-sm text-gray-600">Configure your name, photo and preferred currency in settings.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Create a group</h4>
                  <p className="text-sm text-gray-600">Go to "Groups" → "+" to create a new group and invite members.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Add an expense</h4>
                  <p className="text-sm text-gray-600">Tap "+" in a group to add an expense and choose who participates.</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'offline',
        title: 'Offline Mode',
        icon: WifiOff,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Offline functionality</h3>
            <p className="text-gray-700">BuddyBill works perfectly even without internet connection!</p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-800">🔋 Offline features:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✅ View your groups and expenses</li>
                <li>✅ Create new expenses</li>
                <li>✅ Edit existing expenses</li>
                <li>✅ View balances and settlements</li>
                <li>✅ Use the calculator</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-800">🔄 Synchronization:</h4>
              <p className="text-sm text-yellow-700">All your offline actions are automatically synced as soon as you get back online.</p>
            </div>
          </div>
        )
      },
      {
        id: 'troubleshooting',
        title: 'FAQ & Issues',
        icon: AlertCircle,
        content: (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Frequently asked questions</h3>
            
            <div className="space-y-3">
              <details className="border rounded-lg p-3">
                <summary className="font-semibold cursor-pointer">❓ How to invite someone to a group?</summary>
                <p className="mt-2 text-sm text-gray-600">Go to group → Settings → Members → "Invite" and share the link or code.</p>
              </details>
              
              <details className="border rounded-lg p-3">
                <summary className="font-semibold cursor-pointer">❓ Why isn't my data syncing?</summary>
                <p className="mt-2 text-sm text-gray-600">Check your internet connection. Conflicts may require manual resolution in settings.</p>
              </details>
              
              <details className="border rounded-lg p-3">
                <summary className="font-semibold cursor-pointer">❓ How to change my default currency?</summary>
                <p className="mt-2 text-sm text-gray-600">Profile → Settings → Preferred Currency → Select your currency.</p>
              </details>
            </div>
          </div>
        )
      }
    ]
  }

  const currentSections = helpSections[currentLang]

  if (selectedSection) {
    const section = currentSections.find(s => s.id === selectedSection)
    if (!section) return null

    return (
      <AppLayout title="Aide" showBackButton={true} backHref="/dashboard/profile">
        <MobileCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedSection(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="flex gap-1">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={currentLang === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentLang(lang.code)}
                    className="text-xs"
                  >
                    {lang.flag}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">{section.title}</h2>
            </div>
            
            {section.content}
          </div>
        </MobileCard>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Aide & Support" showBackButton={true} backHref="/dashboard/profile">
      <MobileCard>
        <div className="space-y-4">
          {/* Sélecteur de langue */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Guide d'aide</h2>
            <div className="flex gap-1">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={currentLang === lang.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentLang(lang.code)}
                  className="text-xs"
                >
                  {lang.flag} {lang.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Liste des sections */}
          <div className="space-y-2">
            {currentSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{section.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Contact */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Besoin d'aide supplémentaire ?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {currentLang === 'fr' 
                  ? "N'hésitez pas à nous contacter pour toute question."
                  : "Feel free to contact us for any questions."
                }
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                {currentLang === 'fr' ? 'Nous contacter' : 'Contact us'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileCard>
    </AppLayout>
  )
}
