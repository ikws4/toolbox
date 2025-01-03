import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JsonToCSharpConverter from './components/json-to-csharp-converter'
import GithubRepoStats from './components/github-repo-stats'
import DiffTool from './components/diff-tool'
import ImageSplitTool from './components/image-split-tool'
import { ThemeToggle } from "@/components/theme-toggle"

export default function Dashboard() {
  return (
    <div className="flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Toolbox</h1>
          <ThemeToggle />
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Tabs defaultValue="json-to-csharp" className="space-y-4">
          <TabsList>
            <TabsTrigger value="json-to-csharp">JSON to C# Converter</TabsTrigger>
            <TabsTrigger value="github-stats">GitHub Repo Stats</TabsTrigger>
            <TabsTrigger value="diff-tool">Diff Tool</TabsTrigger>
            <TabsTrigger value="image-split">Image Split Tool</TabsTrigger>
          </TabsList>
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
        </Tabs>
      </div>
    </div>
  )
}
