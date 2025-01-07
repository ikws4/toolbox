'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function UuidGenerator() {
  const [uuid, setUuid] = useState('')

  const generateUuid = () => {
    setUuid(uuidv4())
  }

  return (
    <div className="space-y-4">
      <Button onClick={generateUuid}>Generate UUID</Button>
      {uuid && (
        <Input
          readOnly
          value={uuid}
          className="mt-4"
        />
      )}
    </div>
  )
}