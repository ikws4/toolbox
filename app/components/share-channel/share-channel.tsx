'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Settings, SendHorizontal, LogOut, Image, Link2, User, Users, RefreshCw, Search, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import Peer, { DataConnection } from 'peerjs'
import FileList from './file-list'
import MessageList from './message-list'
import ConnectionSettings from './connection-settings'
import { createJoinerPeer } from './custom-peer'
import { generateEmojiUsername, formatFileSize, DiscoveredChannel, BroadcastMessageType, handlePeerConnectionError } from './utils'

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  type: 'text' | 'image' | 'file'
  fileInfo?: {
    name: string
    size: number
    type: string
    data?: ArrayBuffer
  }
}

export default function ShareChannel() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionMode, setConnectionMode] = useState<'host' | 'join' | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [userName, setUserName] = useState('')
  const [channelId, setChannelId] = useState(Math.random().toString(36).substring(2, 9))
  const [peers, setPeers] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [discoveredChannels, setDiscoveredChannels] = useState<DiscoveredChannel[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showConnectionSettings, setShowConnectionSettings] = useState(false)
  
  const peerRef = useRef<Peer | null>(null)
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const discoveryPeerRef = useRef<Peer | null>(null)
  const { toast } = useToast()

  // Initialize user name from localStorage if available or generate emoji username
  useEffect(() => {
    const savedUserName = localStorage.getItem('shareChannelUserName')
    if (savedUserName) {
      setUserName(savedUserName)
    } else {
      // Generate a default emoji username
      const emojiName = generateEmojiUsername()
      setUserName(emojiName)
      localStorage.setItem('shareChannelUserName', emojiName)
    }
  }, [])

  // Save user name to localStorage when it changes
  useEffect(() => {
    if (userName) {
      localStorage.setItem('shareChannelUserName', userName)
    }
  }, [userName])

  // Automatically trigger channel discovery when the component mounts
  useEffect(() => {
    // Only run discovery if not already connected
    if (!isConnected) {
      discoverChannels()
    }
    
    // Clean up discovery peer on unmount
    return () => {
      if (discoveryPeerRef.current) {
        discoveryPeerRef.current.destroy()
      }
    }
  }, [isConnected])
  // Synchronize connection state when connections change
  useEffect(() => {
    // Get current connection count
    const connectionCount = connectionsRef.current.size;
    console.log("Connection sync effect running - connections:", connectionCount, "mode:", connectionMode, "isConnected:", isConnected);
    
    // If we're in any mode and have at least one connection, we should be connected
    if (connectionCount > 0) {
      console.log("Connection sync effect: We have connections, ensuring isConnected is true");
      setIsConnected(true);
    }
    // If we're in join mode and have no connections, we're disconnected
    else if (connectionMode === 'join' && connectionCount === 0 && isConnected) {
      console.log("Connection sync effect: No connections in join mode, setting isConnected to false");
      setIsConnected(false);
    }
    // If we're in host mode, we're always connected once the peer is created
    else if (connectionMode === 'host' && peerRef.current && !isConnected) {
      console.log("Connection sync effect: In host mode with peer but not connected, fixing state");
      setIsConnected(true);
    }
  }, [peers, connectionMode, isConnected]);

  const handleUserNameChange = (newName: string) => {
    setUserName(newName)
  }
  const handleHostChannel = (id: string) => {
    setChannelId(id)
    setConnectionMode('host')
    
    const peer = new Peer(id, {
      debug: 2,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    })
      peer.on('open', (id) => {
      toast({
        title: "Channel created",
        description: `Your channel ID is ${id}`,
      })
      console.log("Host channel created with ID:", id)
      setIsConnected(true)
      peerRef.current = peer

      // Broadcast channel availability for discovery
      broadcastChannelAnnouncement(id)
    })
    
    peer.on('connection', (conn) => {
      console.log("Host received connection from:", conn.peer)
      setupConnection(conn)
    })
      peer.on('error', (err) => {
      toast({
        title: "Connection error",
        description: handlePeerConnectionError(err),
        variant: "destructive"
      })
    })
  }
  
  const handleJoinChannel = (hostId: string) => {
    if (!hostId || hostId.trim() === '') {
      toast({
        title: "Invalid channel ID",
        description: "Please enter a valid channel ID",
        variant: "destructive"
      })
      return
    }

    // Show a connecting toast
    toast({
      title: "Connecting...",
      description: `Attempting to connect to channel ${hostId}`
    })

    if (!peerRef.current) {
      // Import the createJoinerPeer from custom-peer.ts
      const peer = createJoinerPeer()
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        toast({
          title: "Connection timeout",
          description: "Could not connect to the host channel. Timed out after 10 seconds.",
          variant: "destructive"
        })
        // Clean up the peer if there was a timeout
        if (peer && !peer.destroyed) {
          peer.destroy()
        }
      }, 10000)
        peer.on('open', () => {
        try {
          console.log("Peer opened, attempting to connect to:", hostId)
          const conn = peer.connect(hostId, {
            reliable: true,
            serialization: 'json'
          })
          
          // Store the peer reference immediately (before connection complete)
          // This ensures connection events are properly captured
          peerRef.current = peer
          
          // Connection success events
          conn.on('open', () => {
            // Clear the timeout since connection succeeded
            clearTimeout(connectionTimeout)
            console.log("Connection opened to host:", hostId)
            
            console.log("Setting up joiner peer connection", "Peer:", peer.id, "Host:", hostId)
            setChannelId(hostId)
            setConnectionMode('join')
            
            // Setup connection and explicitly set connected state to true
            setupConnection(conn)
            
            // IMPORTANT: Force connected state to true after a short delay
            // This ensures the UI updates even if other state changes cause batched updates
            setTimeout(() => {
              setIsConnected(true)
              console.log("Explicitly setting isConnected to true after joiner setup (with delay)")
            }, 100)
          })
          
          // Connection failure events
          conn.on('error', (err) => {
            clearTimeout(connectionTimeout)
            console.error("Connection error:", err)
            toast({
              title: "Connection failed",
              description: "Could not connect to the host channel",
              variant: "destructive"
            })
          })
        } catch (err) {
          clearTimeout(connectionTimeout)
          console.error("Failed to establish connection:", err)
          toast({
            title: "Connection error",
            description: "Failed to establish connection",
            variant: "destructive"
          })        }
      })
      
      peer.on('error', (err) => {
        clearTimeout(connectionTimeout)
        console.error("Peer error:", err)
        
        // Check if this is a specific type of connection error
        const errorMessage = handlePeerConnectionError(err);
        
        // If the peer couldn't connect, ensure we reset the state
        if (err.type === 'peer-unavailable' || err.type === 'unavailable-id') {
          // Make sure we clean up any partial state
          if (peerRef.current === peer) {
            peerRef.current = null;
          }
          setIsConnected(false);
          setConnectionMode(null);
        }
        
        toast({
          title: "Connection error",
          description: errorMessage,
          variant: "destructive"
        })
      })
    } else {
      try {
        const conn = peerRef.current.connect(hostId, {
          reliable: true
        })
        
        // Connection success events
        conn.on('open', () => {
          setChannelId(hostId)
          setConnectionMode('join')
          setupConnection(conn)
        })
        
        // Connection failure events
        conn.on('error', (err) => {
          toast({
            title: "Connection failed",
            description: "Could not connect to the host channel",
            variant: "destructive"
          })
        })
      } catch (err) {
        toast({
          title: "Connection error",
          description: "Failed to establish connection",
          variant: "destructive"        })
      }
    }
  }
    const setupConnection = (conn: DataConnection) => {
    console.log("Setting up connection for peer:", conn.peer, "Connection state:", conn.open)
    
    // Add the connection to our connections map immediately
    connectionsRef.current.set(conn.peer, conn)
    
    // Update peer list immediately
    const updatedPeers = Array.from(connectionsRef.current.keys())
    console.log("Updating peers list immediately:", updatedPeers)
    setPeers(updatedPeers)
    
    // If the connection is already open, we need to handle it immediately
    if (conn.open) {
      console.log("Connection is already open, setting isConnected immediately")
      // Set connected state
      setIsConnected(true)
      
      // Send intro message immediately if connection is already open
      conn.send({
        type: 'intro',
        userName: userName,
        peerId: peerRef.current?.id
      })
    }
      conn.on('open', () => {
      console.log("Connection open event triggered for:", conn.peer)
      
      // Make sure the connection is in the map (should already be from above)
      if (!connectionsRef.current.has(conn.peer)) {
        connectionsRef.current.set(conn.peer, conn)
      }
      
      // Send intro message with user details
      conn.send({
        type: 'intro',
        userName: userName,
        peerId: peerRef.current?.id
      })
      
      console.log("Setting isConnected to true for peer:", conn.peer)
      
      // Force to connected state with timeout to ensure UI updates
      setIsConnected(true)
      
      // Update peer list
      const updatedPeers = Array.from(connectionsRef.current.keys())
      console.log("Updated peers list after open:", updatedPeers)
      setPeers(updatedPeers)
      
      // Notify of new connection
      const newMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        senderId: 'system',
        senderName: 'System',
        content: `${conn.peer} has joined the channel`,
        timestamp: Date.now(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, newMsg])
      
      toast({
        title: "Peer connected",
        description: `Connected to ${conn.peer}`,
      })
    })
    
    conn.on('data', (data: any) => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message])
      } else if (data.type === 'intro') {
        // Update connection metadata with user name
        const updatedConn = connectionsRef.current.get(conn.peer)
        if (updatedConn) {
          // We could add metadata here if needed
        }
        
        // Update peer list
        const updatedPeers = Array.from(connectionsRef.current.keys())
        setPeers(updatedPeers)
        
        // Notify of new connection with user name
        const newMsg: Message = {
          id: Math.random().toString(36).substring(2, 9),
          senderId: 'system',
          senderName: 'System',
          content: `${data.userName} (${conn.peer}) has joined the channel`,
          timestamp: Date.now(),
          type: 'text'
        }
        
        setMessages(prev => [...prev, newMsg])
      } else if (data.type === 'file-start') {
        // Handle start of file transfer
        toast({
          title: "File transfer started",
          description: `Receiving ${data.fileName} (${formatFileSize(data.fileSize)})`,
        })
      } else if (data.type === 'file-chunk') {
        // Logic for receiving file chunks
        // In a real app, you would combine chunks and handle file download
      } else if (data.type === 'file-complete') {
        // File transfer is complete
        const fileMsg: Message = {
          id: Math.random().toString(36).substring(2, 9),
          senderId: conn.peer,
          senderName: data.userName || 'Unknown',
          content: `Sent a file: ${data.fileName}`,
          timestamp: Date.now(),
          type: 'file',
          fileInfo: {
            name: data.fileName,
            size: data.fileSize,
            type: data.fileType,
            data: data.fileData
          }
        }
        
        setMessages(prev => [...prev, fileMsg])
        
        toast({
          title: "File received",
          description: `${data.fileName} has been received`,
        })
      }
    })
    
    conn.on('close', () => {
      // Remove connection
      connectionsRef.current.delete(conn.peer)
      
      // Update peer list
      const updatedPeers = Array.from(connectionsRef.current.keys())
      setPeers(updatedPeers)
      
      // Notify of disconnection
      const newMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        senderId: 'system',
        senderName: 'System',
        content: `${conn.peer} has left the channel`,
        timestamp: Date.now(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, newMsg])
      
      toast({
        title: "Peer disconnected",
        description: `${conn.peer} has disconnected`,
      })
      
      if (connectionsRef.current.size === 0 && connectionMode === 'join') {
        setIsConnected(false)
      }
    })
  }
  
  const sendMessage = () => {
    if (!messageInput.trim()) return
    
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: peerRef.current?.id || 'unknown',
      senderName: userName,
      content: messageInput,
      timestamp: Date.now(),
      type: 'text'
    }
    
    // Add to local messages
    setMessages(prev => [...prev, newMessage])
    
    // Send to all peers
    connectionsRef.current.forEach(conn => {
      conn.send({
        type: 'message',
        message: newMessage
      })
    })
    
    setMessageInput('')
  }
  
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...filesArray])
      
      // For each file, create a message and send it
      filesArray.forEach(file => {
        const reader = new FileReader()
        
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            const fileData = event.target.result
            
            // Create a message for the file, removing the "Sent a file: " prefix
            const fileMsg: Message = {
              id: Math.random().toString(36).substring(2, 9),
              senderId: peerRef.current?.id || 'unknown',
              senderName: userName,
              content: '',  // Remove text about "Sent a file"
              timestamp: Date.now(),
              type: 'file',
              fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                data: fileData as ArrayBuffer
              }
            }
            
            // Add to local messages
            setMessages(prev => [...prev, fileMsg])
            
            // Send to all peers
            connectionsRef.current.forEach(conn => {
              // Notify peers about file start
              conn.send({
                type: 'file-start',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                userName: userName
              })
              
              // Send the file data directly 
              conn.send({
                type: 'file-complete',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: fileData,
                userName: userName
              })
            })
          }
        }
        
        reader.readAsArrayBuffer(file)
      })
      
      // Clear the input
      e.target.value = ''
    }
  }
  
  const disconnectChannel = () => {
    // Close all connections
    connectionsRef.current.forEach(conn => {
      conn.close()
    })
    
    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    
    // Reset state
    setIsConnected(false)
    setConnectionMode(null)
    setChannelId('')
    setPeers([])
    connectionsRef.current = new Map()
    
    toast({
      title: "Disconnected",
      description: "You have left the channel",
    })
  }

  // Channel discovery functions
  const discoverChannels = () => {
    setIsRefreshing(true)
    
    // Clear existing discovered channels older than 1 minute
    setDiscoveredChannels(prev => 
      prev.filter(channel => Date.now() - channel.timestamp < 60000)
    )
    
    // Initialize discovery peer if it doesn't exist
    if (!discoveryPeerRef.current) {
      const discoveryPeer = new Peer(`discovery-${Math.random().toString(36).substring(2, 9)}`, {
        debug: 1
      })
      
      discoveryPeer.on('open', () => {
        discoveryPeerRef.current = discoveryPeer
        broadcastDiscoveryRequest()
      })
      
      discoveryPeer.on('connection', (conn) => {
        conn.on('open', () => {
          conn.on('data', (data: any) => {
            if (data.type === BroadcastMessageType.CHANNEL_RESPONSE) {
              // Handle channel response
              const newChannel: DiscoveredChannel = {
                id: data.channelId,
                hostName: data.hostName,
                peerCount: data.peerCount,
                timestamp: Date.now()
              }
              
              setDiscoveredChannels(prev => {
                // Check if this channel already exists
                const exists = prev.some(channel => channel.id === newChannel.id)
                if (exists) {
                  // Update existing channel
                  return prev.map(channel => 
                    channel.id === newChannel.id ? newChannel : channel
                  )
                } else {
                  // Add new channel
                  return [...prev, newChannel]
                }
              })
            }
          })
        })
      })
      
      discoveryPeer.on('error', (err) => {
        console.error('Discovery peer error:', err)
        setIsRefreshing(false)
      })
    } else {
      // Peer already exists, just broadcast discovery request
      broadcastDiscoveryRequest()
    }
    
    // Set timeout to end refresh state
    setTimeout(() => {
      setIsRefreshing(false)
    }, 3000)
  }
  
  const broadcastDiscoveryRequest = () => {
    if (!discoveryPeerRef.current) return
    
    // Broadcast to some common channel IDs that hosts might be using
    // In a real app, this could use UDP broadcast or multicast for proper discovery
    for (let i = 0; i < 10; i++) {
      try {
        const conn = discoveryPeerRef.current.connect(`discovery-broadcast-${i}`, {
          reliable: true
        })
        
        conn.on('open', () => {
          conn.send({
            type: BroadcastMessageType.CHANNEL_DISCOVERY,
            requesterId: discoveryPeerRef.current?.id
          })
          
          // Close after sending request
          setTimeout(() => {
            conn.close()
          }, 1000)
        })
      } catch (error) {
        // Ignore connection errors during discovery
      }
    }
  }
  
  const broadcastChannelAnnouncement = (channelId: string) => {
    if (!peerRef.current) return
    
    // Listen for discovery requests
    const discoveryId = `discovery-broadcast-${Math.floor(Math.random() * 10)}`
    
    // Create a discovery broadcast peer
    const broadcastPeer = new Peer(discoveryId, {
      debug: 1
    })
    
    broadcastPeer.on('open', () => {
      // This peer is just for receiving discovery requests
      broadcastPeer.on('connection', (conn) => {
        conn.on('open', () => {
          conn.on('data', (data: any) => {
            if (data.type === BroadcastMessageType.CHANNEL_DISCOVERY) {
              // Respond to discovery request by connecting back to the requester
              if (peerRef.current && data.requesterId) {
                try {
                  const responseConn = broadcastPeer.connect(data.requesterId, {
                    reliable: true
                  })
                  
                  responseConn.on('open', () => {
                    // Send channel info
                    responseConn.send({
                      type: BroadcastMessageType.CHANNEL_RESPONSE,
                      channelId: channelId,
                      hostName: userName,
                      peerCount: connectionsRef.current.size
                    })
                    
                    // Close after sending response
                    setTimeout(() => {
                      responseConn.close()
                    }, 1000)
                  })
                } catch (error) {
                  // Ignore connection errors during discovery response
                }
              }
            }
          })
        })
      })
    })  }
  
  return (
    <div className="h-full flex flex-col">
      {!isConnected ? (
        <div className="w-full h-full flex flex-col">
          <div className="flex justify-center mb-2">
            <Tabs defaultValue="join" className="w-full max-w-3xl">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="host" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Host Channel
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Join Channel
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4 bg-background rounded-md p-4">
                <TabsContent value="host" className="m-0">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Host a Channel</h2>
                      <p className="text-sm text-muted-foreground">
                        Create a new channel and share the ID with others
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-name">Your Name</Label>
                        <div className="flex gap-2">                          <Input
                            id="user-name"
                            value={userName}
                            onChange={(e) => handleUserNameChange(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => handleUserNameChange(generateEmojiUsername())}
                            variant="outline"
                            size="icon"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="channel-id">Channel ID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="channel-id"
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            placeholder="Enter a channel ID"
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => setChannelId(Math.random().toString(36).substring(2, 9))}
                            variant="outline"
                            size="icon"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button onClick={() => handleHostChannel(channelId)} className="w-full">
                        Host Channel
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="join" className="m-0">
                  <Tabs defaultValue="discover" className="w-full">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">Join a Channel</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect to an existing channel
                      </p>
                    </div>
                    
                    <TabsList className="mb-4">
                      <TabsTrigger value="discover" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Discover
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Manual Join
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-name-join">Your Name</Label>
                        <div className="flex gap-2">
                          <Input                            id="user-name-join"
                            value={userName}
                            onChange={(e) => handleUserNameChange(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => handleUserNameChange(generateEmojiUsername())}
                            variant="outline"
                            size="icon"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <TabsContent value="discover" className="m-0 space-y-2">          <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Available Channels</h3>
                          <div className="flex gap-2">
                            <Button 
                              onClick={discoverChannels} 
                              size="sm" 
                              variant="outline" 
                              disabled={isRefreshing}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                              Refresh
                            </Button>
                            <Button 
                              onClick={() => setShowConnectionSettings(true)}
                              size="sm" 
                              variant="outline"
                              title="Connection settings"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {discoveredChannels.length === 0 ? (
                          <div className="text-center p-6 border rounded-md bg-muted/20">
                            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No channels found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Click refresh to discover channels or host your own
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {[...discoveredChannels]
                              .sort((a, b) => b.timestamp - a.timestamp)
                              .map((channel) => (
                                <div 
                                  key={channel.id} 
                                  className="p-3 border rounded-md hover:bg-accent/10 transition-colors cursor-pointer"
                                  onClick={() => handleJoinChannel(channel.id)}
                                >
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="font-medium">{channel.hostName}</p>
                                      <p className="text-sm text-muted-foreground">ID: {channel.id}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-muted-foreground flex items-center">
                                        <Users className="h-3.5 w-3.5 mr-1" />
                                        {channel.peerCount} connected
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(channel.timestamp), 'HH:mm:ss')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="manual" className="m-0 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="channel-id-join">Channel ID</Label>
                          <Input
                            id="channel-id-join"
                            placeholder="Enter the channel ID"
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinChannel(channelId)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Ask the host for their channel ID
                          </p>
                        </div>
                        
                        <Button onClick={() => handleJoinChannel(channelId)} className="w-full">
                          Join Channel
                        </Button>
                      </TabsContent>
                    </div>
                  </Tabs>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 p-2 border-b">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-500 w-2 h-2"></div>
              <div>
                <h3 className="text-lg font-semibold">
                  {connectionMode === 'host' ? 'Hosting' : 'Joined'}: {channelId}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  <span>{peers.length} connected</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={disconnectChannel} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >              <LogOut className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 border rounded-md p-4 bg-background">
            <MessageList messages={messages} currentUserId={peerRef.current?.id || ''} />
          </div>
          
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={handleFileSelect} variant="outline" size="icon" title="Attach files">
              <Image className="h-4 w-4" />
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={sendMessage} size="icon" title="Send message">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Connection Settings Dialog */}
      <ConnectionSettings 
        isOpen={showConnectionSettings}
        onClose={() => setShowConnectionSettings(false)}
        onSave={(config) => {
          // Handle TURN server configuration
          toast({
            title: "Connection settings updated",
            description: config.useTurn ? "Using TURN server" : "Using default connection"
          })
          setShowConnectionSettings(false)
        }}
      />
    </div>
  )
}