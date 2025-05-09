'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { generateEmojiUsername } from './utils'

interface HostChannelProps {
  userName: string
  onUserNameChange: (name: string) => void
  onHost: (channelId: string) => void
}

export default function HostChannel({ userName, onUserNameChange, onHost }: HostChannelProps) {
  const [channelId, setChannelId] = useState(() => {
    // Generate a random channel ID without the channel- prefix
    return Math.random().toString(36).substring(2, 9)
  })

  const handleCreateChannel = () => {
    if (!channelId.trim()) return
    onHost(channelId)
  }

  const handleGenerateNewName = () => {
    const newName = generateEmojiUsername()
    onUserNameChange(newName)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Host a Channel</CardTitle>
        <CardDescription>
          Create a new channel and share the ID with others to let them join
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-name">Your Name</Label>
          <div className="flex gap-2">
            <Input
              id="user-name"
              value={userName}
              onChange={(e) => onUserNameChange(e.target.value)}
              placeholder="Enter your name"
              className="flex-1"
            />
            <Button 
              onClick={handleGenerateNewName} 
              variant="outline" 
              type="button"
              className="whitespace-nowrap"
            >
              New Emoji
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="channel-id">Channel ID</Label>
          <Input
            id="channel-id"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Enter a unique channel ID"
          />
          <p className="text-sm text-muted-foreground">
            This will be used by others to join your channel
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateChannel} className="w-full">
          Create Channel
        </Button>
      </CardFooter>
    </Card>
  )
}