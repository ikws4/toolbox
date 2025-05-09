'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCw, Settings, Shield } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ProxySettings, useProxySettings } from './proxy-config'

interface ProxyConfigComponentProps {
  onSettingsChange: (settings: ProxySettings) => void
}

export default function ProxyConfigComponent({ onSettingsChange }: ProxyConfigComponentProps) {
  const { settings, updateSettings, detectAndConfigure, isDetecting } = useProxySettings()
  
  const handleSave = () => {
    onSettingsChange(settings)
  }
  
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="network-settings">
        <AccordionTrigger className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Network & Proxy Settings</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-proxy">Use Proxy/TURN</Label>
                <p className="text-xs text-muted-foreground">
                  Enable if you're behind a firewall or restricted network
                </p>
              </div>
              <Switch
                id="use-proxy"
                checked={settings.useProxy}
                onCheckedChange={(checked) => updateSettings({ useProxy: checked })}
              />
            </div>
            
            {settings.useProxy && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="turn-enabled">Enable TURN Server</Label>
                      <p className="text-xs text-muted-foreground">
                        Use TURN relay for connections that can't be established directly
                      </p>
                    </div>
                    <Switch
                      id="turn-enabled"
                      checked={settings.turnEnabled}
                      onCheckedChange={(checked) => updateSettings({ turnEnabled: checked })}
                    />
                  </div>
                </div>
                
                {settings.turnEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="proxy-url">TURN Server URL</Label>
                      <Input
                        id="proxy-url"
                        value={settings.proxyUrl || ''}
                        placeholder="turn:your-turn-server.com:3478"
                        onChange={(e) => updateSettings({ proxyUrl: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="turn-username">Username</Label>
                        <Input
                          id="turn-username"
                          value={settings.turnUsername || ''}
                          placeholder="TURN username"
                          onChange={(e) => updateSettings({ turnUsername: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="turn-credential">Credential</Label>
                        <Input
                          id="turn-credential"
                          type="password"
                          value={settings.turnCredential || ''}
                          placeholder="TURN credential"
                          onChange={(e) => updateSettings({ turnCredential: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="force-turn">Force TURN Relay</Label>
                        <p className="text-xs text-muted-foreground">
                          Always use TURN relay even if direct connection is possible
                        </p>
                      </div>
                      <Switch
                        id="force-turn"
                        checked={settings.forceTurn}
                        onCheckedChange={(checked) => updateSettings({ forceTurn: checked })}
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={detectAndConfigure}
                disabled={isDetecting}
              >
                <RotateCw className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
                {isDetecting ? 'Detecting...' : 'Auto-Detect'}
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSave}
              >
                <Settings className="h-4 w-4 mr-2" />
                Apply Settings
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}