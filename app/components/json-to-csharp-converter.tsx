'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function getPropertyType(value: any, key: string): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "List<object>"
    const elementType = getPropertyType(value[0], key)
    return `List<${elementType}>`
  }
  if (typeof value === 'object' && value !== null) return capitalizeFirstLetter(key)
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double'
  }
  if (typeof value === 'boolean') return 'bool'
  return 'object'
}

function generateCSharpClass(className: string, obj: any): string {
  let classDefinition = `public class ${className}\n{\n`
  for (const [key, value] of Object.entries(obj)) {
    const propertyName = capitalizeFirstLetter(key)
    const propertyType = getPropertyType(value, key)
    classDefinition += `    public ${propertyType} ${propertyName} { get; set; }\n`
  }
  classDefinition += '}\n'
  return classDefinition
}

function parseJson(json: any, className: string = 'RootObject'): string {
  let csharpClasses = ''
  const queue = [{ obj: json, name: className }]
  const processedClasses = new Set()

  while (queue.length > 0) {
    const { obj, name } = queue.shift()!
    if (processedClasses.has(name)) continue
    processedClasses.add(name)

    csharpClasses += generateCSharpClass(name, obj) + '\n'

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        queue.push({ obj: value, name: capitalizeFirstLetter(key) })
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        queue.push({ obj: value[0], name: capitalizeFirstLetter(key) })
      }
    }
  }

  return csharpClasses.trim()
}

export default function JsonToCSharpConverter() {
  const [jsonInput, setJsonInput] = useState('')
  const [csharpOutput, setCsharpOutput] = useState('')
  const { toast } = useToast()

  const convertJsonToCSharp = () => {
    try {
      const jsonObject = JSON.parse(jsonInput)
      const csharpClasses = parseJson(jsonObject)
      setCsharpOutput(csharpClasses)
    } catch (error) {
      setCsharpOutput(`Invalid JSON input: ${error}`)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csharpOutput)
      toast({
        title: "Copied to clipboard",
        description: "The C# code has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "An error occurred while copying to clipboard.",
        variant: "destructive",
      })
    }
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Paste your JSON here"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="min-h-[200px] custom-scrollbar"
        />
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Characters: {jsonInput.length.toLocaleString()}</span>
          {jsonInput.length > 0 && (
            <span>
              Lines: {jsonInput.split('\n').length} | 
              Non-whitespace: {jsonInput.replace(/\s/g, '').length.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <Button onClick={convertJsonToCSharp}>Convert</Button>
      <div className="relative">
        <Textarea
          value={csharpOutput}
          readOnly
          className="min-h-[200px] pr-12 custom-scrollbar"
        />
        <Button
          size="icon"
          variant="outline"
          className="absolute right-2 top-2"
          onClick={copyToClipboard}
          disabled={!csharpOutput}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy to clipboard</span>
        </Button>
      </div>
    </div>
  )
}

