'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JsonToCSharpConverter from './components/json-to-csharp-converter'
import GithubRepoStats from './components/github-repo-stats'
import DiffTool from './components/diff-tool'
import ImageSplitTool from './components/image-split-tool'
import UuidGenerator from './components/uuid-generator'
import BinaryVisualizationTool from './components/binary-visualization-tool'
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Toolbox</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button onClick={() => window.history.back()} variant="outline" size="icon">
              <X className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <X className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Tabs defaultValue="json-to-csharp" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList>
              <TabsTrigger value="json-to-csharp">JSON to C# Converter</TabsTrigger>
              <TabsTrigger value="github-stats">GitHub Repo Stats</TabsTrigger>
              <TabsTrigger value="diff-tool">Diff Tool</TabsTrigger>
              <TabsTrigger value="image-split">Image Split Tool</TabsTrigger>
              <TabsTrigger value="uuid-generator">UUID Generator</TabsTrigger>
              <TabsTrigger value="binary-visualization">Binary Visualization Tool</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="json-to-csharp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JSON to C# Converter</CardTitle>
                <CardDescription>
                  Convert JSON objects to C# classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JsonToCSharpConverter />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="github-stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Repository Statistics</CardTitle>
                <CardDescription>
                  View statistics for a GitHub repository, including stars and recent release downloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GithubRepoStats />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="diff-tool" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Text Comparison Tool</CardTitle>
                <CardDescription>
                  Compare two texts and see the differences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DiffTool />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="image-split" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Image Split Tool</CardTitle>
                <CardDescription>
                  Split an image into a specified number of rows and columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageSplitTool />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="uuid-generator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>UUID Generator</CardTitle>
                <CardDescription>
                  Generate UUIDs quickly and easily
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UuidGenerator />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="binary-visualization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Binary Visualization Tool</CardTitle>
                <CardDescription>
                  Visualize binary trees from BFS order data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BinaryVisualizationTool />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <footer className="text-center py-4">
        &copy; {new Date().getFullYear()} ikws4. All rights reserved.
      </footer>
    </div>
  )
}
