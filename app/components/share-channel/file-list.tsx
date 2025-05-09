'use client'

import { FileText, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface FileListProps {
  files: File[]
  onRemove: (index: number) => void
}

export default function FileList({ files, onRemove }: FileListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}