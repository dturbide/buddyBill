'use client'

import React, { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  isRefreshing?: boolean
}

export default function PullToRefresh({ onRefresh, children, isRefreshing = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const threshold = 80 // Distance nécessaire pour déclencher le refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || startY === 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY) * 0.5) // Résistance de 50%
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold + 20))
    }
  }

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance >= threshold && !isRefreshing) {
      await onRefresh()
    }
    
    setIsPulling(false)
    setPullDistance(0)
    setStartY(0)
  }

  useEffect(() => {
    if (!isPulling) {
      setPullDistance(0)
    }
  }, [isPulling])

  const refreshOpacity = Math.min(pullDistance / threshold, 1)
  const iconRotation = (pullDistance / threshold) * 180

  return (
    <div 
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
    >
      {/* Indicateur de pull-to-refresh */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: refreshOpacity,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`
        }}
      >
        <div className="flex items-center gap-2 text-blue-600">
          <RefreshCw 
            className="h-5 w-5 transition-transform duration-200"
            style={{ 
              transform: `rotate(${iconRotation}deg)`,
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Mise à jour...' : pullDistance >= threshold ? 'Relâchez pour actualiser' : 'Tirez pour actualiser'}
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateY(${isPulling ? pullDistance : 0}px)` 
        }}
      >
        {children}
      </div>
    </div>
  )
}
