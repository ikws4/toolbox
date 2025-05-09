'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Info, AlertTriangle } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProxyConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: {useTurn: boolean, customServer?: string}) => void
}

export default function ProxyConfig({ isOpen, onClose, onSave }: ProxyConfigProps) {
  const [useTurn, setUseTurn] = useState(false)
  const [customServer, setCustomServer] = useState('')
  const [activeTab, setActiveTab] = useState<string>('recommended')
  
  const handleSave = useCallback(() => {
    onSave({
      useTurn,
      customServer: activeTab === 'custom' ? customServer : undefined
    })
    onClose()
  }, [useTurn, customServer, activeTab, onSave, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connection Settings</DialogTitle>
          <DialogDescription>
            Configure connection options to improve peer-to-peer connectivity
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-md mb-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">Connection issues may occur in some networks. Try these options if you're having trouble.</p>
        </div>
        
        <Tabs defaultValue="recommended" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="custom">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommended" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="flex items-center h-5 mt-1">
                  <input
                    id="use-turn"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={useTurn}
                    onChange={(e) => setUseTurn(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="use-turn" className="font-medium">Use TURN relay fallback</label>
                  <p className="text-muted-foreground">
                    Helps establish connections through firewalls and NATs using a relay server when direct connection isn't possible.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="custom-server">Custom signaling server</Label>
              <Input
                id="custom-server"
                placeholder="e.g., https://your-peerjs-server.com"
                value={customServer}
                onChange={(e) => setCustomServer(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only use if you have access to a custom PeerJS server
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
