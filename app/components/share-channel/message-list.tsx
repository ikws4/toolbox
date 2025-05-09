'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle, Download, FileText, Image as ImageIcon, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'

interface MessageProps {
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

interface MessageListProps {
  messages: MessageProps[]
  currentUserId: string
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleDownload = (message: MessageProps) => {
    if (!message.fileInfo?.data) return

    const blob = new Blob([message.fileInfo.data], { type: message.fileInfo.type || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = message.fileInfo.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const isImage = (type: string) => {
    return type.startsWith('image/')
  }

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message</p>
        </div>
      ) : (
        messages.map(message => (
          <div 
            key={message.id}
            className={`flex items-start gap-2 ${
              message.senderId === 'system' 
                ? 'justify-center' 
                : message.senderId === currentUserId 
                  ? 'flex-row-reverse' 
                  : 'flex-row'
            }`}
          >
            {/* System message */}
            {message.senderId === 'system' ? (
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full max-w-xs sm:max-w-sm md:max-w-md text-sm text-muted-foreground">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{message.content}</span>
                <span className="text-xs opacity-70 ml-1.5 flex-shrink-0">{formatTimestamp(message.timestamp)}</span>
              </div>
            ) : (
              <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] ${
                message.senderId === currentUserId ? 'items-end' : 'items-start'
              }`}>
                {/* Username and timestamp */}
                <div className={`flex items-center gap-2 mb-1 ${
                  message.senderId === currentUserId ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <span className="font-medium text-sm">{message.senderName}</span>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
                </div>

                {/* Message content bubble */}
                <div className={`px-4 py-2 rounded-lg bg-secondary text-secondary-foreground rounded-tl-none'`}>
                  {/* Text message */}
                  {message.type === 'text' && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                  
                  {/* Image message */}
                  {message.type === 'image' && message.fileInfo && (
                    <div className="space-y-2">
                      {message.fileInfo.data && isImage(message.fileInfo.type) && (
                        <div className="mt-2 overflow-hidden">
                          <div className="max-h-[240px] overflow-hidden">
                            <img 
                              src={URL.createObjectURL(new Blob([message.fileInfo.data], { type: message.fileInfo.type }))} 
                              alt={message.fileInfo.name}
                              className="max-w-full object-contain rounded"
                              style={{ maxHeight: '240px' }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                            <span className="truncate max-w-[180px]">{message.fileInfo.name}</span>
                            <span>{formatFileSize(message.fileInfo.size)}</span>
                          </div>
                        </div>
                      )}
                      <Button 
                        variant={message.senderId === currentUserId ? "secondary" : "primary"} 
                        size="sm" 
                        onClick={() => handleDownload(message)}
                        className="mt-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                  
                  {/* File message */}
                  {message.type === 'file' && message.fileInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-background/30 backdrop-blur-sm rounded">
                        {isImage(message.fileInfo.type) ? (
                          <ImageIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{message.fileInfo.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(message.fileInfo.size)}</p>
                        </div>
                      </div>
                      {message.fileInfo.data && isImage(message.fileInfo.type) && (
                        <div className="mt-2 overflow-hidden">
                          <div className="max-h-[240px] overflow-hidden">
                            <img 
                              src={URL.createObjectURL(new Blob([message.fileInfo.data], { type: message.fileInfo.type }))} 
                              alt={message.fileInfo.name}
                              className="max-w-full object-contain rounded"
                              style={{ maxHeight: '240px' }}
                            />
                          </div>
                        </div>
                      )}
                      <Button 
                        variant={message.senderId === currentUserId ? "secondary" : "primary"} 
                        size="sm" 
                        onClick={() => handleDownload(message)}
                        className="mt-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}