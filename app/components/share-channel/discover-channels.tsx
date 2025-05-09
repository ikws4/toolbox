'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, RefreshCw } from 'lucide-react'
import { DiscoveredChannel } from './utils'
import { format } from 'date-fns'

interface DiscoverChannelsProps {
  onJoin: (channelId: string) => void
  discoveredChannels: DiscoveredChannel[]
  onRefresh: () => void
  isRefreshing: boolean
}

export default function DiscoverChannels({ 
  onJoin, 
  discoveredChannels, 
  onRefresh, 
  isRefreshing 
}: DiscoverChannelsProps) {
  // Sort channels by timestamp (newest first)
  const sortedChannels = [...discoveredChannels].sort((a, b) => b.timestamp - a.timestamp)

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm:ss')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Available Channels</h3>
        <Button onClick={onRefresh} size="sm" variant="outline" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {sortedChannels.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-muted/50">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No channels found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click refresh to discover channels or host your own
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedChannels.map((channel) => (
            <Card key={channel.id} className="hover:bg-accent/10 transition-colors">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{channel.hostName}</p>
                  <p className="text-sm text-muted-foreground">
                    Channel ID: {channel.id}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{channel.peerCount} peers connected</span>
                    <span className="mx-2">•</span>
                    <span>Last seen at {formatTimestamp(channel.timestamp)}</span>
                  </div>
                </div>
                <Button onClick={() => onJoin(channel.id)} size="sm">
                  Join
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}