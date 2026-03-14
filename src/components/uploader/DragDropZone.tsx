"use client"

import * as React from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface DragDropZoneProps {
    onUpload: (files: File[]) => void
}

export function DragDropZone({ onUpload }: DragDropZoneProps) {
    const [isDragOver, setIsDragOver] = React.useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => setIsDragOver(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUpload(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(Array.from(e.target.files))
        }
    }

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all bg-white",
                isDragOver ? "border-[#00D084] bg-emerald-50/50" : "border-slate-200 hover:border-[#00D084]/50 hover:bg-slate-50/30"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-[#00D084]" />
                </div>
                <p className="mb-2 text-sm text-slate-600">
                    <span className="font-bold text-[#0D163F]">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">JSON workflow files only (MAX: 5MB)</p>
            </div>
            <input
                type="file"
                className="hidden"
                accept=".json"
                multiple
                onChange={handleFileChange}
                id="file-upload"
            />
            <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer" />
        </div>
    )
}
