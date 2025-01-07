'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Tree from 'react-d3-tree'
import { Card } from '@/components/ui/card'

interface TreeNode {
  name: string
  children: TreeNode[]
}

function buildTree(nodes: (string | null)[]): TreeNode | null {
  if (!nodes.length) return null
  const root: TreeNode = { name: nodes[0]!, children: [] }
  const queue: TreeNode[] = [root]
  let i = 1
  while (i < nodes.length) {
    const current = queue.shift()!
    if (nodes[i] !== null) {
      const leftChild: TreeNode = { name: nodes[i]!, children: [] }
      current.children.push(leftChild)
      queue.push(leftChild)
    }
    i++
    if (i < nodes.length && nodes[i] !== null) {
      const rightChild: TreeNode = { name: nodes[i]!, children: [] }
      current.children.push(rightChild)
      queue.push(rightChild)
    }
    i++
  }
  return root
}

export default function BinaryVisualizationTool() {
  const [input, setInput] = useState<string>('1,2,3,null,null,4,5')
  const [tree, setTree] = useState<TreeNode | null>(null)

  const handleGenerate = () => {
    const nodes = input.split(',').map(val => (val.trim() === 'null' ? null : val.trim()))
    setTree(buildTree(nodes))
  }

  return (
    <div className="space-y-4">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter BFS order (e.g., 1,2,3,null,null,4,5)"
      />
      <Button onClick={handleGenerate}>Generate Tree</Button>
      {tree && (
        <Card className="w-[100%] h-[500px]">
          <Tree
            data={tree}
            orientation="vertical"
          />
        </Card>
      )}
    </div>
  )
}
