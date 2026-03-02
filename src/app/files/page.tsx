"use client"

import * as React from "react"
import { DragDropZone } from "@/components/uploader/DragDropZone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

        const newlyIndexed = []
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
        <div className="flex flex-col p-8 h-full space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Sample JSON Files</h2>
                <p className="text-muted-foreground">
                    Upload existing workflows to build the AI knowledge base.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Workflows</CardTitle>
                        <CardDescription>Drag and drop valid JSON workflows here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DragDropZone onUpload={handleUpload} />
                        {files.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Files ready to index:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    {files.map((file, i) => (
                                        <li key={i}>{file.name} - {(file.size / 1024).toFixed(2)} KB</li>
                                    ))}
                                </ul>
                                <Button className="w-full" onClick={handleProcessFiles} disabled={isUploading}>
                                    {isUploading ? "Uploading..." : "Process & Extract"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* List of uploaded files here */}
                <Card>
                    <CardHeader>
                        <CardTitle>Indexed Workflows</CardTitle>
                        <CardDescription>Files successfully analyzed by system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {indexedFiles.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No files synced yet.</div>
                        ) : (
                            <ul className="space-y-3">
                                {indexedFiles.map((file, i) => (
                                    <li key={i} className="flex justify-between items-center p-3 rounded-md bg-secondary border border-border">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB • {file.stats?.nodeCount || 0} Nodes</span>
                                        </div>
                                        <div className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">Synced</div>
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
