'use client'

import { useEffect, useState } from 'react'

// Default STUN and TURN servers for WebRTC connections through firewalls/NATs
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

// Interface for proxy settings
export interface ProxySettings {
  useProxy: boolean
  proxyUrl?: string
  iceServers: RTCIceServer[]
  turnEnabled: boolean
  turnUsername?: string
  turnCredential?: string
  forceTurn: boolean // Force using TURN even when direct connection might be possible
}

// Default proxy settings
export const DEFAULT_PROXY_SETTINGS: ProxySettings = {
  useProxy: false,
  iceServers: DEFAULT_ICE_SERVERS,
  turnEnabled: false,
  forceTurn: false,
}

// Detect if we need proxy settings based on browser detection and network capabilities
export const detectProxyNeeds = async (): Promise<boolean> => {
  try {
    // Check if we're behind symmetric NAT by attempting a simple WebRTC self-connection
    const pc1 = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS })
    const pc2 = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS })
    
    let candidatesGathered = 0
    let hasReflexiveCandidates = false
    
    pc1.onicecandidate = (e) => {
      if (e.candidate) {
        candidatesGathered++
        // Check if we get a server-reflexive candidate (indicates non-symmetric NAT)
        if (e.candidate.candidate.includes('srflx')) {
          hasReflexiveCandidates = true
        }
        pc2.addIceCandidate(e.candidate)
      }
    }
    
    // Create and set offer
    const offer = await pc1.createOffer({ offerToReceiveAudio: true })
    await pc1.setLocalDescription(offer)
    await pc2.setRemoteDescription(offer)
    
    // Create and set answer
    const answer = await pc2.createAnswer()
    await pc2.setLocalDescription(answer)
    await pc1.setRemoteDescription(answer)
    
    // Wait for ICE gathering to complete (or at least get some candidates)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    pc1.close()
    pc2.close()
    
    // If we gathered candidates but no server-reflexive candidates, we likely need a TURN server
    const needsProxy = candidatesGathered > 0 && !hasReflexiveCandidates
    return needsProxy
  } catch (error) {
    console.error('Error detecting proxy needs:', error)
    // Default to not needing proxy if detection fails
    return false
  }
}

// Build PeerJS ICE configuration based on proxy settings
export const buildPeerJsConfig = (proxySettings: ProxySettings): any => {
  const iceServers = [...proxySettings.iceServers]
  
  // Add TURN server configuration if enabled
  if (proxySettings.turnEnabled && proxySettings.proxyUrl) {
    iceServers.push({
      urls: proxySettings.proxyUrl,
      username: proxySettings.turnUsername || '',
      credential: proxySettings.turnCredential || '',
    })
  }
  
  return {
    debug: 2,
    config: {
      iceServers,
      iceTransportPolicy: proxySettings.forceTurn ? 'relay' : 'all',
    }
  }
}

// Save and load proxy settings from localStorage
export const saveProxySettings = (settings: ProxySettings): void => {
  localStorage.setItem('shareChannelProxySettings', JSON.stringify(settings))
}

export const loadProxySettings = (): ProxySettings => {
  try {
    const savedSettings = localStorage.getItem('shareChannelProxySettings')
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  } catch (error) {
    console.error('Error loading proxy settings:', error)
  }
  return DEFAULT_PROXY_SETTINGS
}

// React hook for proxy settings
export const useProxySettings = () => {
  const [settings, setSettings] = useState<ProxySettings>(DEFAULT_PROXY_SETTINGS)
  const [isDetecting, setIsDetecting] = useState(false)
  
  useEffect(() => {
    const loadedSettings = loadProxySettings()
    setSettings(loadedSettings)
  }, [])
  
  const updateSettings = (newSettings: Partial<ProxySettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    saveProxySettings(updatedSettings)
  }
  
  const detectAndConfigure = async () => {
    setIsDetecting(true)
    try {
      const needsProxy = await detectProxyNeeds()
      updateSettings({ useProxy: needsProxy })
    } finally {
      setIsDetecting(false)
    }
  }
  
  return {
    settings,
    updateSettings,
    detectAndConfigure,
    isDetecting,
  }
}