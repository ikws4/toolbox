'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ChevronRight, ChevronDown, Copy, Trash, Plus, Edit2 } from 'lucide-react'

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

function convertToType(value: string) {
  // Handle null and undefined
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  // Handle boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Handle number
  if (!isNaN(Number(value))) {
    // Preserve string if it starts with 0 (except for "0" itself)
    if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
      return value;
    }
    return Number(value);
  }

  // Try parsing JSON for arrays and objects
  try {
    return JSON.parse(value);
  } catch {
    // If not valid JSON, return as string
    return value;
  }
}

function JsonNode({ data, level = 0, propertyName = '', onUpdate, path = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleUpdate = (newValue) => {
    const convertedValue = convertToType(newValue);
    onUpdate(path, convertedValue)
    setIsEditing(false)
  }

  const handleAdd = () => {
    if (Array.isArray(data)) {
      onUpdate([...path], [...data, null])
    } else {
      const newKey = prompt('Enter property name:')
      if (newKey) {
        onUpdate([...path, newKey], { ...data, [newKey]: null })
      }
    }
  }

  const handleDelete = () => {
    const parentPath = path.slice(0, -1)
    const parentData = parentPath.reduce((obj, key) => obj[key], data)
    if (Array.isArray(parentData)) {
      const index = path[path.length - 1]
      const newArray = [...parentData]
      newArray.splice(index, 1)
      onUpdate(parentPath, newArray)
    } else {
      const key = path[path.length - 1]
      const { [key]: _, ...rest } = parentData
      onUpdate(parentPath, rest)
    }
  }

  if (typeof data !== 'object' || data === null) {
    const typeColor = {
      string: 'text-[#4caf50]',
      number: 'text-[#ff6b6b]',
      boolean: 'text-[#ff9800]',
      undefined: 'text-gray-400',
      null: 'text-gray-400'
    }[typeof data ?? 'null'];

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <span className="flex items-center text-sm py-1">
            <span className="w-4" /> {/* Spacing for alignment */}
            {propertyName && (
              <span className="text-[#8e4caf] font-medium">
                {propertyName}:&nbsp;
                <span className="text-gray-400 text-xs">
                  ({typeof data})
                </span>
                &nbsp;
              </span>
            )}
            {isEditing ? (
              <Input
                size="sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleUpdate(editValue)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(editValue)}
                autoFocus
                className="w-[200px]"
                placeholder={`Enter ${typeof data} value...`}
              />
            ) : (
              <span className={typeColor}>
                {typeof data === 'string' ? `"${data}"` : String(data)}
              </span>
            )}
          </span>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => {
            setEditValue(typeof data === 'string' ? data : String(data))
            setIsEditing(true)
          }}>
            <Edit2 className="w-4 h-4 mr-2" />Edit ({typeof data})
          </ContextMenuItem>
          <ContextMenuItem onClick={() => copyToClipboard(JSON.stringify(data))}>
            <Copy className="w-4 h-4 mr-2" />Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDelete}>
            <Trash className="w-4 h-4 mr-2" />Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const isArray = Array.isArray(data)
  const keys = Object.keys(data)
  const isEmpty = keys.length === 0
  const preview = isEmpty ? '' : `: ${isArray ? `Array(${keys.length})` : `Object(${keys.length})`}`

  return (
    <div className="text-sm">
      <ContextMenu>
        <ContextMenuTrigger>
            <div 
            className="flex items-center py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" 
            onClick={() => setExpanded(!expanded)}
            >
            <span className="w-4">
              {!isEmpty && (expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
              ))}
            </span>
            {propertyName && (
              <span className="text-[#8e4caf] font-medium">{propertyName}</span>
            )}
            <span className="text-gray-600">{preview}</span>
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />Add
          </ContextMenuItem>
          <ContextMenuItem onClick={() => copyToClipboard(JSON.stringify(data))}>
            <Copy className="w-4 h-4 mr-2" />Copy
          </ContextMenuItem>
          {level > 0 && (
            <ContextMenuItem onClick={handleDelete}>
              <Trash className="w-4 h-4 mr-2" />Delete
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {expanded && !isEmpty && (
        <div className="ml-4 border-gray-200 pl-2">
          {keys.map((key, index) => (
            <div key={index} className="relative">
              <JsonNode 
                data={data[key]} 
                level={level + 1} 
                propertyName={!isArray ? key : ''} 
                onUpdate={onUpdate}
                path={[...path, isArray ? index : key]}
              />
            </div>
          ))}
        </div>
      )}
      {expanded && isEmpty && (
        <div className="ml-8 py-1 text-gray-500">
          {isArray ? '[]' : '{}'}
        </div>
      )}
    </div>
  )
}

export default function JsonViewer() {
  const [jsonInput, setJsonInput] = useState('')
  const [parsedJson, setParsedJson] = useState(null)
  const [error, setError] = useState('')

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setParsedJson(parsed)
      setError('')
    } catch (error) {
      setParsedJson(null)
      setError('Invalid JSON')
    }
  }

  const handleUpdate = (path, newValue) => {
    const updateObject = (obj, pathArray, value) => {
      if (pathArray.length === 0) return value
      const [head, ...rest] = pathArray
      const newObj = Array.isArray(obj) ? [...obj] : { ...obj }
      newObj[head] = updateObject(obj[head], rest, value)
      return newObj
    }

    setParsedJson(updateObject(parsedJson, path, newValue))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Enter JSON data"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="min-h-[200px] custom-scrollbar font-mono"
        />
        <Button variant="outline" onClick={() => copyToClipboard(jsonInput)}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <Button onClick={formatJson}>Format JSON</Button>
      {error && <div className="text-red-500">{error}</div>}
      {parsedJson && (
        <Card>
          <CardContent className="pt-6">
            <div className="font-mono rounded-lg overflow-x-auto">
              <JsonNode data={parsedJson} onUpdate={handleUpdate} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
