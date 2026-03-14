"use client"

import * as React from "react"
import { DragDropZone } from "@/components/uploader/DragDropZone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileJson } from "lucide-react"

export default function FilesPage() {
    const [files, setFiles] = React.useState<File[]>([])
    const [isUploading, setIsUploading] = React.useState(false)
    const [indexedFiles, setIndexedFiles] = React.useState<any[]>([])

    const handleUpload = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles])
    }

    const handleProcessFiles = async () => {
        if (files.length === 0) return
        setIsUploading(true)

        const newlyIndexed: { name: string; size: number; stats: { nodeCount: number; apiBlockCount: number; conditionBlockCount: number } }[] = []
        // Upload files to API Route that processes them using Supabase
        for (const file of files) {
            const formData = new FormData()
            formData.append("file", file)

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })
                const data = await res.json()
                if (data.success) {
                    newlyIndexed.push({ name: file.name, size: file.size, stats: data.stats })
                } else {
                    alert(`Failed to process ${file.name}: ${data.error}`)
                }
            } catch (err) {
                console.error("Upload failed", err)
                alert(`Network error for ${file.name}`)
            }
        }

        setIsUploading(false)
        setFiles([])
        setIndexedFiles((prev) => [...prev, ...newlyIndexed])
    }

    return (
        <div className="flex flex-col p-6 lg:p-12 h-full space-y-10 lg:space-y-12 bg-transparent overflow-y-auto custom-scrollbar">
            <header className="max-w-4xl">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-brand-navy">Sample Workflows</h2>
                <p className="text-slate-500 mt-2.5 font-medium text-sm lg:text-base leading-relaxed">
                    Index existing JSON documents to enhance AI generation precision and maintain structural consistency.
                </p>
            </header>

            <div className="grid gap-8 lg:grid-cols-2 max-w-7xl">
                <Card className="border-none bg-white shadow-xl shadow-slate-200/40 rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20">
                        <CardTitle className="text-xl font-bold text-brand-navy">Upload Documents</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Drag and drop valid 11za JSON workflows.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex-1 flex flex-col space-y-8">
                        <DragDropZone onUpload={handleUpload} />
                        {files.length > 0 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center space-x-2">
                                    <div className="px-3 py-1 rounded-lg bg-emerald-50 text-brand-green text-[10px] font-bold uppercase tracking-widest border border-emerald-100/50">
                                        Queue: {files.length} Files
                                    </div>
                                </div>
                                <ul className="text-sm space-y-3 bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                                    {files.map((file, i) => (
                                        <li key={i} className="flex justify-between items-center text-brand-navy">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                                                <span className="font-semibold truncate max-w-[180px]">{file.name}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold tracking-wider">{(file.size / 1024).toFixed(0)} KB</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="premium" className="w-full rounded-2xl h-14 text-base font-bold shadow-lg shadow-brand-green/10 transition-all hover:scale-[1.01] active:scale-95" onClick={handleProcessFiles} disabled={isUploading}>
                                    {isUploading ? "Indexing Content..." : "Process Workflows"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none bg-white shadow-xl shadow-slate-200/40 rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20">
                        <CardTitle className="text-xl font-bold text-brand-navy">Knowledge Base</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Workflows successfully indexed by 11za AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex-1">
                        {indexedFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center">
                                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group">
                                    <FileJson className="w-8 h-8 text-slate-200 transition-colors group-hover:text-brand-green/30" />
                                </div>
                                <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Repository Empty</p>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {indexedFiles.map((file, i) => (
                                    <li key={i} className="flex justify-between items-center p-6 rounded-2xl border border-slate-50 bg-white hover:border-brand-green/20 hover:bg-emerald-50/10 transition-all duration-300 group">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-brand-navy truncate">{file.name}</span>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className="text-[10px] font-bold text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-bold text-brand-green/80">{file.stats?.nodeCount || 0} Nodes</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center space-x-2 bg-emerald-50 text-brand-green px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                            <span>Ready</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
