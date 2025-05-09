'use client'

import Peer, { PeerJSOption } from 'peerjs'

// Enhancement to the standard PeerJS configuration
export const createCustomPeer = (id: string, options?: PeerJSOption) => {
  // Default ice servers with multiple fallbacks
  const defaultIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ]

  // Merge user options with our defaults
  const mergedOptions: PeerJSOption = {
    debug: 1,
    config: {
      iceServers: defaultIceServers,
    },
    ...options,
    // Ensure our ice servers are included
    config: {
      ...options?.config,
      iceServers: [
        ...(options?.config?.iceServers || []),
        ...defaultIceServers
      ]
    }
  }

  // Create and return the peer
  return new Peer(id, mergedOptions)
}

// Helper function to create a discovery peer
export const createDiscoveryPeer = () => {
  const id = `discovery-${Math.random().toString(36).substring(2, 9)}`
  return createCustomPeer(id, { debug: 0 })
}

// Helper function to create a host peer
export const createHostPeer = (id: string) => {
  return createCustomPeer(id, { debug: 1 })
}

// Helper function to create a joiner peer
export const createJoinerPeer = () => {
  const id = `joiner-${Math.random().toString(36).substring(2, 9)}`
  return createCustomPeer(id, { debug: 1 })
}
