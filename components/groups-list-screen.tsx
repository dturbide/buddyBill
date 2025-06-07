"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, MoreVertical, Plus, User, Trash2, Copy, CheckCircle, Search, PlusCircle, Users, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useNotifications } from '@/components/notification-system'
import { AppLayout, MobileCard } from '@/components/app-layout'
import { useTranslation } from 'react-i18next'

interface Group {
  id: string
  name: string
  imageUrl?: string
  memberCount: number
  userBalance: string
  lastActivity: string
  description?: string
  currency?: string
  inviteCode?: string
}

// Données de fallback pour le développement
const dummyGroups: Group[] = []

const GroupCard: React.FC<{ 
  group: Group
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>
}> = ({ group, setGroups }) => {
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const notifications = useNotifications()
  
  const balanceColor = group.userBalance.startsWith("+")
    ? "text-green-600"
    : group.userBalance.startsWith("-")
      ? "text-red-600"
      : "text-gray-500"

  const copyInviteCode = async () => {
    if (group.inviteCode) {
      try {
        await navigator.clipboard.writeText(group.inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Erreur copie code:', err)
      }
    }
  }

  const handleDeleteGroup = async () => {
    console.log('🗑️ FRONTEND DELETE - Fonction handleDeleteGroup appelée pour groupe:', group.id, group.name)
    
    notifications.showConfirmation({
      title: 'Supprimer le groupe',
      message: `Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ? Cette suppression est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        console.log('🗑️ FRONTEND DELETE - Confirmation reçue, début suppression:', group.id)
        setIsDeleting(true)
        try {
          console.log('🗑️ FRONTEND DELETE - Début suppression groupe:', group.id)
          
          const response = await fetch('/api/groups/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId: group.id
            })
          })

          console.log('🗑️ FRONTEND DELETE - Statut réponse:', response.status)
          const result = await response.json()
          console.log('🗑️ FRONTEND DELETE - Réponse API:', result)

          if (response.ok && result.success) {
            notifications.showSuccess('Suppression réussie', result.message || 'Groupe supprimé avec succès')
            
            // Mettre à jour la liste des groupes localement
            console.log('🗑️ FRONTEND DELETE - Mise à jour liste groupes')
            setGroups(prevGroups => prevGroups.filter(g => g.id !== group.id))
          } else {
            console.error('🗑️ FRONTEND DELETE - Erreur API:', result.error)
            notifications.showError('Erreur de suppression', `Erreur lors de la suppression: ${result.error}`)
          }
        } catch (error) {
          console.error('🗑️ FRONTEND DELETE - Erreur suppression groupe:', error)
          notifications.showError('Erreur de connexion', 'Erreur lors de la suppression du groupe')
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={group.imageUrl || "/placeholder.svg"} alt={group.name} />
          <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base font-semibold mb-0.5">{group.name}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="h-3 w-3 mr-1" /> {group.memberCount} membres
          </div>
          <p className={`text-sm font-medium mt-1 ${balanceColor}`}>{group.userBalance}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/group/${group.id}`)}>
              <User className="mr-2 h-4 w-4" />
              Voir Détails
            </DropdownMenuItem>
            {group.inviteCode && (
              <DropdownMenuItem onClick={copyInviteCode}>
                {copied ? <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copié!" : "Copier Code"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDeleteGroup} className="text-red-600" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      {group.description && (
        <CardContent className="px-4 pb-0">
          <p className="text-sm text-muted-foreground">{group.description}</p>
        </CardContent>
      )}
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <span>Dernière activité: {group.lastActivity}</span>
      </CardFooter>
    </Card>
  )
}

export default function GroupsListScreen() {
  const { t } = useTranslation(['common', 'dashboard'])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        setError(null)

        // Vérification de l'authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          router.push('/signin')
          return
        }

        if (!user) {
          console.error('No user found')
          router.push('/signin')
          return
        }

        console.log('🔍 USER AUTH - Utilisateur authentifié:', user.email)

        // Récupération des groupes de l'utilisateur
        const { data: groupsData, error: groupsError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            groups!inner (
              id,
              name,
              description,
              invite_code,
              created_at
            )
          `)
          .eq('user_id', user.id)

        if (groupsError) {
          console.error('Groups fetch error:', groupsError)
          setError(`Erreur lors de la récupération des groupes: ${groupsError.message}`)
          return
        }

        if (!groupsData || groupsData.length === 0) {
          console.log('✅ USER GROUPS - Aucun groupe trouvé pour cet utilisateur')
          setGroups([])
          return
        }

        console.log('✅ USER GROUPS - Groupes trouvés:', groupsData)

        // Transformation des données
        const transformedGroups: Group[] = groupsData.map((item: any) => {
          const group = item.groups
          return {
            id: group.id,
            name: group.name,
            description: group.description,
            memberCount: 1, // TODO: Compter les vrais membres
            userBalance: 'Settled', // TODO: Calculer le vrai solde
            lastActivity: new Date(group.created_at).toLocaleDateString('fr-FR'),
            inviteCode: group.invite_code || null,
          }
        })

        setGroups(transformedGroups)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Une erreur inattendue s\'est produite')
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [supabase, router])

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <AppLayout title={t('common:navigation.groups')} showNavigation={false}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t('common:loading')}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout title={t('common:navigation.groups')} showNavigation={false}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500">Erreur : {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Réessayer
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={t('common:navigation.groups')}>
      <div className="space-y-4">
        {/* Actions rapides */}
        <MobileCard>
          <div className="space-y-2">
            <Link href="/create-group" passHref legacyBehavior>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-5 w-5" /> Créer un Nouveau Groupe
              </Button>
            </Link>
            <Link href="/join-group" passHref legacyBehavior>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-5 w-5" /> Rejoindre un Groupe
              </Button>
            </Link>
          </div>
        </MobileCard>

        {/* Liste des groupes */}
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <MobileCard>
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="w-24 h-24 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Vous n'êtes membre d'aucun groupe.</h3>
                <p className="text-muted-foreground mb-6">
                  Créez un groupe pour commencer à partager des dépenses !
                </p>
                <Link href="/create-group">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Créer un groupe
                  </Button>
                </Link>
              </div>
            </MobileCard>
          ) : (
            filteredGroups.map((group) => (
              <MobileCard key={group.id} className="overflow-hidden transition-all hover:shadow-md">
                <GroupCard group={group} setGroups={setGroups} />
              </MobileCard>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
