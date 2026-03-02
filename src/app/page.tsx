"use client"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Download, Code2 } from "lucide-react"
import { useWorkflowStore } from "@/lib/store"

export default function Home() {
  const { activeJson } = useWorkflowStore()

  const handleCopy = () => {
    navigator.clipboard.writeText(activeJson)
  }

  const handleDownload = () => {
    const blob = new Blob([activeJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "generated_workflow.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex w-full h-full">
      {/* Left Chat Area */}
      <div className="flex-1 max-w-2xl border-r border-border bg-background flex flex-col h-full">
        <div className="p-4 border-b border-border bg-card shadow-sm">
          <h2 className="text-xl font-bold">AI Workflow Assistant</h2>
          <p className="text-xs text-muted-foreground">Type your requirements to generate a valid JSON workflow</p>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <ChatWindow />
        </div>
      </div>

      {/* Right JSON Preview Area */}
      <div className="flex-1 flex flex-col bg-muted/20 p-6 overflow-hidden">
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Workflow Output</h2>
        </div>

        <Card className="flex-1 flex flex-col h-full overflow-hidden border-border bg-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-3 bg-[#252526]">
            <div className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">generated_workflow.json</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                title="Copy to clipboard"
                onClick={handleCopy}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                title="Download JSON"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto bg-transparent relative">
            <div className="absolute inset-0">
              <pre className="p-4 text-xs font-mono text-[#D4D4D4] h-full overflow-auto">
                <code>{activeJson}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
