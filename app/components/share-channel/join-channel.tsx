'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DiscoverChannels from './discover-channels'
import { DiscoveredChannel } from './utils'

interface JoinChannelProps {
  userName: string
  onUserNameChange: (name: string) => void
  onJoin: (channelId: string) => void
  discoveredChannels: DiscoveredChannel[]
  onRefreshChannels: () => void
  isRefreshing: boolean
}

export default function JoinChannel({ 
  userName, 
  onUserNameChange, 
  onJoin,
  discoveredChannels,
  onRefreshChannels,
  isRefreshing
}: JoinChannelProps) {
  const [channelId, setChannelId] = useState('')

  const handleJoinChannel = () => {
    if (!channelId.trim()) return
    onJoin(channelId)
  }

  return (
    <Tabs defaultValue="discover" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="discover">Discover Channels</TabsTrigger>
        <TabsTrigger value="manual">Manual Join</TabsTrigger>
      </TabsList>
      <TabsContent value="discover">
        <Card>
          <CardHeader>
            <CardTitle>Discover Channels</CardTitle>
            <CardDescription>
              Find and join available channels on your local network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name-discover">Your Name</Label>
              <Input
                id="user-name-discover"
                value={userName}
                onChange={(e) => onUserNameChange(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <DiscoverChannels 
              onJoin={onJoin}
              discoveredChannels={discoveredChannels}
              onRefresh={onRefreshChannels}
              isRefreshing={isRefreshing}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle>Join a Channel</CardTitle>
            <CardDescription>
              Enter a channel ID to join an existing shared channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name-join">Your Name</Label>
              <Input
                id="user-name-join"
                value={userName}
                onChange={(e) => onUserNameChange(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-id-join">Channel ID</Label>
              <Input
                id="channel-id-join"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Enter the channel ID you want to join"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinChannel()}
              />
              <p className="text-sm text-muted-foreground">
                Ask the host for their channel ID
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleJoinChannel} className="w-full">
              Join Channel
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}