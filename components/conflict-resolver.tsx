'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Merge, 
  ArrowLeft, 
  ArrowRight,
  Calendar,
  DollarSign,
  FileText,
  User
} from 'lucide-react'
import { DataConflict, ConflictResolution, useConflictResolution } from '@/hooks/use-conflict-resolution'
import { SafeTranslation } from '@/components/safe-translation'

interface ConflictResolverProps {
  onConflictsResolved?: () => void
  className?: string
}

export function ConflictResolver({ onConflictsResolved, className }: ConflictResolverProps) {
  const { conflicts, isResolving, resolveConflict, autoResolveAllConflicts } = useConflictResolution()
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null)
  const [manualResolution, setManualResolution] = useState<any>({})

  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center">
            <div className="space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">
                <SafeTranslation tKey="no_conflicts" ns="offline" />
              </h3>
              <p className="text-muted-foreground">
                <SafeTranslation tKey="all_data_synced" ns="offline" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleResolveConflict = async (resolution: ConflictResolution) => {
    await resolveConflict(resolution)
    setSelectedConflict(null)
    
    if (conflicts.length <= 1) {
      onConflictsResolved?.()
    }
  }

  const handleAutoResolveAll = async () => {
    const remaining = await autoResolveAllConflicts()
    if (remaining.length === 0) {
      onConflictsResolved?.()
    }
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'amount': return <DollarSign className="h-4 w-4" />
      case 'description': return <FileText className="h-4 w-4" />
      case 'expense_date': return <Calendar className="h-4 w-4" />
      case 'paid_by': return <User className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatFieldValue = (field: string, value: any) => {
    switch (field) {
      case 'amount':
        return `${value}€`
      case 'expense_date':
        return new Date(value).toLocaleDateString()
      default:
        return String(value)
    }
  }

  // Vue de la liste des conflits
  if (!selectedConflict) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <SafeTranslation tKey="data_conflicts" ns="offline" />
              <Badge variant="destructive">{conflicts.length}</Badge>
            </CardTitle>
            
            <Button 
              variant="outline" 
              onClick={handleAutoResolveAll}
              disabled={isResolving}
            >
              <Merge className="h-4 w-4 mr-2" />
              <SafeTranslation tKey="auto_resolve" ns="offline" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <Card key={conflict.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedConflict(conflict)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {conflict.type}
                          </Badge>
                          <span className="font-medium">
                            {conflict.local_data.description || 'Sans description'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Conflits :</span>
                          {conflict.field_conflicts.map(field => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {getFieldIcon(field)}
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  // Vue détaillée d'un conflit
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedConflict(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <SafeTranslation tKey="resolve_conflict" ns="offline" />
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informations sur le conflit */}
        <div className="space-y-2">
          <h4 className="font-semibold">{selectedConflict.local_data.description}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{selectedConflict.type}</Badge>
            <span>•</span>
            <span>{selectedConflict.field_conflicts.length} champs en conflit</span>
          </div>
        </div>

        <Separator />

        {/* Comparaison des données */}
        <div className="grid grid-cols-2 gap-4">
          {/* Version locale */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <SafeTranslation tKey="local_version" ns="offline" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedConflict.field_conflicts.map(field => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    {getFieldIcon(field)}
                    {field}
                  </div>
                  <div className="text-sm p-2 bg-blue-50 rounded border border-blue-200">
                    {formatFieldValue(field, selectedConflict.local_data[field])}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Version serveur */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <SafeTranslation tKey="server_version" ns="offline" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedConflict.field_conflicts.map(field => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    {getFieldIcon(field)}
                    {field}
                  </div>
                  <div className="text-sm p-2 bg-green-50 rounded border border-green-200">
                    {formatFieldValue(field, selectedConflict.server_data[field])}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Actions de résolution */}
        <div className="space-y-3">
          <h4 className="font-semibold">
            <SafeTranslation tKey="resolution_options" ns="offline" />
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleResolveConflict({
                conflict_id: selectedConflict.id,
                resolution_type: 'use_local'
              })}
              disabled={isResolving}
              className="flex flex-col h-auto p-4 text-left"
            >
              <div className="flex items-center gap-2 font-semibold text-blue-700">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <SafeTranslation tKey="use_local" ns="offline" />
              </div>
              <div className="text-xs text-muted-foreground">
                <SafeTranslation tKey="keep_my_changes" ns="offline" />
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleResolveConflict({
                conflict_id: selectedConflict.id,
                resolution_type: 'use_server'
              })}
              disabled={isResolving}
              className="flex flex-col h-auto p-4 text-left"
            >
              <div className="flex items-center gap-2 font-semibold text-green-700">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <SafeTranslation tKey="use_server" ns="offline" />
              </div>
              <div className="text-xs text-muted-foreground">
                <SafeTranslation tKey="use_server_data" ns="offline" />
              </div>
            </Button>
          </div>
          
          <Button 
            variant="default" 
            onClick={() => handleResolveConflict({
              conflict_id: selectedConflict.id,
              resolution_type: 'merge',
              merged_data: {
                ...selectedConflict.server_data,
                ...selectedConflict.local_data
              }
            })}
            disabled={isResolving}
            className="w-full"
          >
            <Merge className="h-4 w-4 mr-2" />
            <SafeTranslation tKey="smart_merge" ns="offline" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
