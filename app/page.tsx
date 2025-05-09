'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import JsonToCSharpConverter from './components/json-to-csharp-converter'
import GithubRepoStats from './components/github-repo-stats'
import DiffTool from './components/diff-tool'
import ImageSplitTool from './components/image-split-tool'
import UuidGenerator from './components/uuid-generator'
import BinaryVisualizationTool from './components/binary-visualization-tool'
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Menu, Maximize2, Minimize2, X, 
  Code, Github, FileTerminal, ImageIcon, FileBadge, TreePine, FileJson, Terminal, Share2 } from "lucide-react"
import JsonViewer from './components/json-viewer'
import SourceCodeTyper from './components/source-code-typer'
import ShareChannel from './components/share-channel/share-channel'
import { cn } from "@/lib/utils"

// Define tool configuration for easy management
const tools = [
	{ 
		id: "json-to-csharp", 
		title: "JSON to C#", 
		description: "Convert JSON objects to C# classes", 
		component: JsonToCSharpConverter,
		icon: Code
	},
	{ 
		id: "github-stats", 
		title: "GitHub Stats", 
		description: "View statistics for a GitHub repository, including stars and recent release downloads", 
		component: GithubRepoStats,
		icon: Github
	},
	{ 
		id: "diff-tool", 
		title: "Diff Tool", 
		description: "Compare two texts and see the differences", 
		component: DiffTool,
		icon: FileTerminal
	},
	{ 
		id: "image-split", 
		title: "Image Split", 
		description: "Split an image into a specified number of rows and columns", 
		component: ImageSplitTool,
		icon: ImageIcon
	},	{ 
		id: "uuid-generator", 
		title: "UUID Generator", 
		description: "Generate UUIDs quickly and easily", 
		component: UuidGenerator,
		icon: FileBadge
	},
	{ 
		id: "binary-visualization", 
		title: "Binary Visualization", 
		description: "Visualize binary trees from BFS order data", 
		component: BinaryVisualizationTool,
		icon: TreePine
	},
	{ 
		id: "json-viewer", 
		title: "JSON Viewer", 
		description: "View and format JSON data", 
		component: JsonViewer,
		icon: FileJson
	},
	{ 
		id: "code-typer", 
		title: "Code Typer", 
		description: "Create typing effect presentations for your source code", 
		component: SourceCodeTyper,
		icon: Terminal
	},
	{ 
		id: "share-channel", 
		title: "Share Channel", 
		description: "Create or join a channel to share messages, images, and files with peers over the local network", 
		component: ShareChannel,
		icon: Share2
	},
];

export default function Dashboard() {
	const [activeToolId, setActiveToolId] = useState<string>("json-to-csharp");
	const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
	const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
	const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
	
	const activeTool = tools.find(tool => tool.id === activeToolId);

	const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
	const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
	const toggleFullscreen = () => setFullscreenMode(!fullscreenMode);

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Top header bar - visible when not in fullscreen mode */}
			{!fullscreenMode && (				<header className="border-b flex items-center justify-between h-16 px-4 bg-background z-10">					<div className="flex items-center gap-2">						<Button 
							variant="ghost" 
							size="icon" 
							className="md:hidden" 
							onClick={toggleMobileMenu}
						>
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle menu</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="hidden md:flex h-9 w-9"
							onClick={toggleSidebar}
						>
							{sidebarCollapsed ? (
								<ChevronRight className="h-5 w-5" />
							) : (
								<ChevronLeft className="h-5 w-5" />
							)}
						</Button>
								{activeTool && (
							<div className="flex items-center">
								<activeTool.icon className="h-5 w-5 mr-2" />
								<h1 className="text-xl font-bold tracking-tight">{activeTool.title}</h1>
							</div>
						)}
					</div>
					
					<div className="flex items-center space-x-2">
						<Button 
							variant="outline" 
							size="icon"
							onClick={toggleFullscreen}
							className="ml-auto"
						>
							<Maximize2 className="h-[1.2rem] w-[1.2rem]" />
							<span className="sr-only">Enter fullscreen</span>
						</Button>
						<ThemeToggle />
						<Button 
							onClick={() => window.history.back()} 
							variant="outline" 
							size="icon"
							className="hidden md:flex"
						>
							<X className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<X className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="sr-only">Close</span>
						</Button>
					</div>
				</header>
			)}

			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar for tool selection - hidden in fullscreen mode */}
				{!fullscreenMode && (					<aside 
						className={cn(
							"border-r shrink-0 bg-background flex flex-col transition-all duration-300 ease-in-out z-10",
							sidebarCollapsed ? "w-0 md:w-16 overflow-hidden" : "w-full md:w-64",
							mobileMenuOpen ? "absolute inset-y-0 left-0 z-50 w-64" : "hidden md:flex"
						)}
					>						<div className="p-4 overflow-y-auto flex-1 space-y-4">
							{/* Title for mobile menu */}
							{mobileMenuOpen && (
								<div className="flex items-center justify-between mb-2">
									<h2 className="text-lg font-semibold">Tools</h2>
									<Button
										variant="ghost"
										size="icon"
										className="md:hidden h-8 w-8"
										onClick={() => setMobileMenuOpen(false)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							)}
							<nav className="space-y-1">
								{tools.map((tool) => (									<Button
										key={tool.id}
										variant={activeToolId === tool.id ? "secondary" : "ghost"}
										className={cn(
											"w-full flex items-center text-left",
											sidebarCollapsed && !mobileMenuOpen ? "justify-center p-2" : "justify-start pl-2 pr-3 py-2 h-auto"
										)}
										onClick={() => {
											setActiveToolId(tool.id);
											setMobileMenuOpen(false);
										}}
									><tool.icon className={cn(
											"h-5 w-5 flex-shrink-0",
											activeToolId === tool.id ? "text-secondary-foreground" : "text-muted-foreground"
										)} />
										{(!sidebarCollapsed || mobileMenuOpen) && (
											<span className="ml-2 font-medium">{tool.title}</span>
										)}
									</Button>
								))}
							</nav>
						</div>
					</aside>
				)}
				
				{/* Mobile overlay when sidebar is open */}
				{mobileMenuOpen && (
					<div 
						className="fixed inset-0 bg-black/50 z-40 md:hidden"
						onClick={() => setMobileMenuOpen(false)}
					/>
				)}

				{/* Main content area */}
				<main className="flex-1 overflow-auto bg-background relative">
					{/* Fullscreen toggle button for easy exit */}
					{fullscreenMode && (
						<Button 
							variant="outline" 
							size="icon"
							onClick={toggleFullscreen}
							className="absolute top-4 right-4 z-50"
						>
							<Minimize2 className="h-[1.2rem] w-[1.2rem]" />
							<span className="sr-only">Exit fullscreen</span>
						</Button>
					)}
					
					<Tabs value={activeToolId} className="h-full flex flex-col">
						{tools.map((tool) => (							<TabsContent 
								key={tool.id} 
								value={tool.id} 
								className="flex-1 p-0 data-[state=active]:flex data-[state=active]:flex-col h-full"
							>								<div className={cn(
									"flex-1 flex flex-col h-full", 
									!fullscreenMode && "p-2 md:p-3"
								)}>
									<div className="flex-1 overflow-auto">
										{/* Dynamic component rendering */}
										{activeTool?.id === tool.id && <tool.component />}
									</div>
								</div>
							</TabsContent>
						))}
					</Tabs>
				</main>
			</div>

			{/* Footer - hidden in fullscreen mode */}
			{!fullscreenMode && (
				<footer className="border-t text-center py-3 px-4 text-sm text-muted-foreground">
					&copy; {new Date().getFullYear()} ikws4. All rights reserved.
				</footer>
			)}
		</div>
	)
}
