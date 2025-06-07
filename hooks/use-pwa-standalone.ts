'use client'

import { useState, useEffect } from 'react'

/**
 * Hook pour détecter si l'application fonctionne en mode PWA standalone
 * @returns boolean - true si l'app est en mode standalone, false sinon
 */
export function usePWAStandalone() {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const checkStandalone = () => {
      if (typeof window === 'undefined') return false
      
      // Détection pour iOS
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      // Détection pour Android/Chrome
      const isAndroidStandalone = window.matchMedia('(display-mode: standalone)').matches
      
      // Détection alternative via window.navigator
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches
      
      return isIOSStandalone || isAndroidStandalone || isMinimalUI
    }

    // Vérification initiale
    setIsStandalone(checkStandalone())

    // Écouter les changements de mode d'affichage
    const handleDisplayModeChange = () => {
      setIsStandalone(checkStandalone())
    }

    // Écouter les changements de media query pour le mode standalone
    const standaloneQuery = window.matchMedia('(display-mode: standalone)')
    const minimalUIQuery = window.matchMedia('(display-mode: minimal-ui)')
    
    standaloneQuery.addEventListener('change', handleDisplayModeChange)
    minimalUIQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      standaloneQuery.removeEventListener('change', handleDisplayModeChange)
      minimalUIQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  return isStandalone
}

/**
 * Hook pour détecter les informations de l'appareil et du navigateur
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({ 
    device: 'unknown' as 'ios' | 'android' | 'desktop' | 'unknown',
    browser: 'unknown' as 'safari' | 'chrome' | 'firefox' | 'other' | 'unknown'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)
    const isFirefox = /firefox/.test(userAgent)
    
    let device: 'ios' | 'android' | 'desktop' = 'desktop'
    if (isIOS) device = 'ios'
    else if (isAndroid) device = 'android'
    
    let browser: 'safari' | 'chrome' | 'firefox' | 'other' = 'other'
    if (isSafari) browser = 'safari'
    else if (isChrome) browser = 'chrome'
    else if (isFirefox) browser = 'firefox'
    
    setDeviceInfo({ device, browser })
  }, [])

  return deviceInfo
}
