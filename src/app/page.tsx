"use client"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Download, Code2, MessageSquare } from "lucide-react"
import { useWorkflowStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-col lg:flex-row w-full h-full bg-transparent overflow-hidden">
      {/* Left Chat Area */}
      <div className="flex-1 lg:max-w-[500px] xl:max-w-[600px] border-r border-slate-100 bg-white flex flex-col h-[50vh] lg:h-full overflow-hidden shadow-sm lg:shadow-none z-10">
        <div className="px-6 lg:px-8 flex h-16 lg:h-20 items-center justify-between border-b border-slate-50">
          <div className="flex flex-col">
            <h2 className="text-lg lg:text-xl font-bold text-brand-navy tracking-tight">Workflow Assistant</h2>
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-brand-green animate-pulse" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Enhanced by 11za AI</span>
            </div>
          </div>
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
            <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative bg-[#F8FAFB]">
          <ChatWindow />
        </div>
      </div>

      {/* Right JSON Preview Area */}
      <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-hidden bg-background">
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-brand-navy">Live Output</h2>
            <p className="text-[10px] lg:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-widest">Real-time workflow integrity verification</p>
          </div>
          <div className="flex space-x-3">
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-5 h-10 lg:h-11 font-semibold transition-all">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="premium" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none rounded-xl px-6 lg:px-8 h-10 lg:h-11 font-bold shadow-lg shadow-brand-green/20 hover:scale-[1.02] active:scale-95 transition-all">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-none bg-white shadow-xl shadow-slate-200/50 rounded-[1.5rem] lg:rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between px-6 lg:px-8 py-4 lg:py-5 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="px-2.5 py-0.5 rounded-lg bg-brand-navy text-white text-[10px] font-bold uppercase tracking-wider">JSON</div>
              <CardTitle className="text-[10px] lg:text-xs font-semibold text-slate-500 tracking-tight">generated_workflow.json</CardTitle>
            </div>
            <div className="flex items-center">
               <div className="px-3 py-1 rounded-full bg-emerald-50 text-brand-green text-[10px] font-bold uppercase tracking-widest border border-emerald-100">Valid Schema</div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto bg-[#0F172A] relative custom-scrollbar">
            <div className="absolute inset-0">
              <pre className="p-6 lg:p-10 text-[10px] lg:text-[11px] font-mono text-emerald-50/90 h-full overflow-auto selection:bg-brand-green/30 leading-relaxed">
                <code>{activeJson}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
