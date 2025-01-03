'use client'

import { useState } from 'react'
import * as diff from 'diff'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

export default function DiffTool() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [diffResult, setDiffResult] = useState<diff.Change[]>([])

  const compareDiff = () => {
    const differences = diff.diffWords(text1, text2)
    setDiffResult(differences)
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea
          placeholder="Enter first text"
          value={text1}
          onChange={(e) => setText1(e.target.value)}
          className="min-h-[200px] custom-scrollbar"
        />
        <Textarea
          placeholder="Enter second text"
          value={text2}
          onChange={(e) => setText2(e.target.value)}
          className="min-h-[200px] custom-scrollbar"
        />
      </div>
      <Button onClick={compareDiff}>Compare</Button>
      {diffResult.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="whitespace-pre-wrap custom-scrollbar max-h-[400px] overflow-y-auto">
              {diffResult.map((part, index) => (
                <span
                  key={index}
                  className={
                    part.added
                      ? 'bg-green-500 bg-opacity-20 dark:bg-green-900 dark:bg-opacity-40'
                      : part.removed
                      ? 'bg-red-500 bg-opacity-20 dark:bg-red-900 dark:bg-opacity-40'
                      : ''
                  }
                >
                  {part.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

