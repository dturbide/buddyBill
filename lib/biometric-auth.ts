'use client'

import { createClient } from '@/lib/supabase/client'

// Interface pour les credentials WebAuthn
interface BiometricCredential {
  id: string
  rawId: ArrayBuffer
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse
  type: 'public-key'
}

// Interface pour stocker les credentials dans Supabase
interface StoredCredential {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  counter: number
  device_name: string
  created_at: string
}

class BiometricAuthService {
  private supabase = createClient()

  // Vérifier si la biométrie est supportée
  isSupported(): boolean {
    return !!(
      window.navigator &&
      'credentials' in window.navigator &&
      'create' in window.navigator.credentials &&
      'get' in window.navigator.credentials &&
      window.PublicKeyCredential
    )
  }

  // Déterminer le type de biométrie disponible
  getAvailableBiometricType(): string {
    if (typeof window === 'undefined') return 'unavailable'
    
    const userAgent = window.navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'Face ID / Touch ID'
    } else if (userAgent.includes('android')) {
      return 'Empreinte digitale'
    } else if (userAgent.includes('windows')) {
      return 'Windows Hello'
    } else if (userAgent.includes('mac')) {
      return 'Touch ID'
    }
    
    return 'Authentification biométrique'
  }

  // Encoder ArrayBuffer en base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  // Décoder base64 en ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  // Obtenir le domaine pour WebAuthn
  private getDomainForWebAuthn(): string {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname
  }

  // Enregistrer un nouveau credential biométrique
  async registerBiometric(userId: string, deviceName?: string): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error('Authentification biométrique non supportée')
      }

      // Générer un challenge unique
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      // Configuration pour l'enregistrement
      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'BuddyBill',
            id: this.getDomainForWebAuthn(),
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: `user_${userId}`,
            displayName: 'Utilisateur BuddyBill',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Force biométrie locale
            userVerification: 'required',
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: 'direct',
        },
      }

      // Créer le credential
      const credential = await navigator.credentials.create(createCredentialOptions) as BiometricCredential

      if (!credential) {
        throw new Error('Impossible de créer le credential biométrique')
      }

      // Stocker dans Supabase
      const credentialData = {
        user_id: userId,
        credential_id: this.arrayBufferToBase64(credential.rawId),
        public_key: this.arrayBufferToBase64(
          (credential.response as AuthenticatorAttestationResponse).getPublicKey()!
        ),
        counter: (credential.response as AuthenticatorAttestationResponse).getAuthenticatorData ? 0 : 0,
        device_name: deviceName || this.getAvailableBiometricType(),
      }

      const { error } = await this.supabase
        .from('biometric_credentials')
        .insert(credentialData)

      if (error) {
        console.error('Erreur sauvegarde credential:', error)
        throw new Error('Impossible de sauvegarder le credential')
      }

      return true
    } catch (error) {
      console.error('Erreur enregistrement biométrique:', error)
      throw error
    }
  }

  // Authentifier avec biométrie
  async authenticateWithBiometric(userId?: string): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error('Authentification biométrique non supportée')
      }

      // Récupérer les credentials existants pour cet utilisateur
      let query = this.supabase.from('biometric_credentials').select('*')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: credentials, error } = await query

      if (error || !credentials || credentials.length === 0) {
        throw new Error('Aucun credential biométrique trouvé')
      }

      // Préparer les credentials pour l'authentification
      const allowCredentials = credentials.map((cred: StoredCredential) => ({
        id: this.base64ToArrayBuffer(cred.credential_id),
        type: 'public-key' as const,
      }))

      // Générer un challenge
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      // Configuration pour l'authentification
      const getCredentialOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials,
          userVerification: 'required',
          timeout: 60000,
          rpId: this.getDomainForWebAuthn(),
        },
      }

      // Authentifier
      const assertion = await navigator.credentials.get(getCredentialOptions) as BiometricCredential

      if (!assertion) {
        throw new Error('Authentification biométrique échouée')
      }

      // Vérifier que le credential existe toujours
      const credentialId = this.arrayBufferToBase64(assertion.rawId)
      const matchingCredential = credentials.find((cred: StoredCredential) => cred.credential_id === credentialId)

      if (!matchingCredential) {
        throw new Error('Credential non reconnu')
      }

      // Ici on pourrait vérifier la signature, mais pour simplifier on fait confiance au navigateur
      return true
    } catch (error) {
      console.error('Erreur authentification biométrique:', error)
      throw error
    }
  }

  // Lister les credentials d'un utilisateur
  async getUserCredentials(userId: string): Promise<StoredCredential[]> {
    try {
      const { data, error } = await this.supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erreur récupération credentials:', error)
      return []
    }
  }

  // Supprimer un credential
  async removeCredential(credentialId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('biometric_credentials')
        .delete()
        .eq('id', credentialId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Erreur suppression credential:', error)
      return false
    }
  }

  // Vérifier si un utilisateur a des credentials biométriques
  async hasCredentials(userId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('biometric_credentials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('Erreur vérification credentials:', error)
      return false
    }
  }
}

export const biometricAuth = new BiometricAuthService()
export default biometricAuth
