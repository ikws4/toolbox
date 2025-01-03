'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

interface RepoStats {
  name: string
  stars: number
  forks: number
  openIssues: number
  recentReleaseDownloads: number
}

export default function GithubRepoStats() {
  const [repoInput, setRepoInput] = useState('')
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRepoStats = async () => {
    setLoading(true)
    setError(null)
    setRepoStats(null)

    try {
      const [owner, repo] = repoInput.split('/')
      if (!owner || !repo) {
        throw new Error('Please enter a valid repository in the format "owner/repo"')
      }

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
      if (!repoResponse.ok) {
        throw new Error('Repository not found or API rate limit exceeded')
      }
      const repoData = await repoResponse.json()

      const releasesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`)
      if (!releasesResponse.ok) {
        throw new Error('Failed to fetch releases data')
      }
      const releasesData = await releasesResponse.json()

      let recentReleaseDownloads = 0
      if (releasesData.length > 0) {
        const latestRelease = releasesData[0]
        recentReleaseDownloads = latestRelease.assets.reduce((total: number, asset: any) => total + asset.download_count, 0)
      }

      setRepoStats({
        name: repoData.full_name,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        recentReleaseDownloads
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="repoInput">GitHub Repository</Label>
        <Input
          type="text"
          id="repoInput"
          placeholder="owner/repo"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
        />
      </div>
      <Button onClick={fetchRepoStats} disabled={loading}>
        {loading ? 'Fetching...' : 'Fetch Stats'}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {repoStats && (
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-semibold">{repoStats.name}</h3>
          <p>Stars: {repoStats.stars.toLocaleString()}</p>
          <p>Forks: {repoStats.forks.toLocaleString()}</p>
          <p>Open Issues: {repoStats.openIssues.toLocaleString()}</p>
          <p>Recent Release Downloads: {repoStats.recentReleaseDownloads.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}

