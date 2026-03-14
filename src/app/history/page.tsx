"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, History, Clock, Calendar, Zap, CheckCircle2, AlertCircle, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWorkflowStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
    const { history, clearHistory, setActiveJson } = useWorkflowStore()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="p-10 h-full bg-[#F9FBFA]" />;
    }

    const handleLoad = (json: string) => {
        setActiveJson(json)
        window.location.href = "/"
    }

    const formatDate = (isoDate: string) => {
        try {
            return new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(new Date(isoDate))
        } catch {
            return isoDate
        }
    }

    return (
        <div className="flex flex-col p-6 lg:p-12 h-full space-y-10 lg:space-y-12 bg-transparent overflow-y-auto custom-scrollbar">
            <header className="max-w-4xl flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
                            <History className="w-4 h-4 text-brand-green" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Activity Log</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-brand-navy">Generation History</h2>
                    <p className="text-slate-500 mt-2.5 font-medium text-sm lg:text-base leading-relaxed">
                        Audit and manage historical workflow generations and AI corrections.
                    </p>
                </div>
                {history.length > 0 && (
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            if (confirm("Clear all history? This cannot be undone.")) {
                                clearHistory()
                            }
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors h-10 px-6 rounded-xl border border-slate-100 bg-white shadow-sm"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Archive
                    </Button>
                )}
            </header>

            {!history || history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 lg:py-40 text-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl shadow-slate-100 flex items-center justify-center border border-slate-50">
                        <Clock className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">No records found</p>
                </div>
            ) : (
                <div className="grid gap-6 lg:gap-10 lg:grid-cols-2 max-w-7xl">
                    {history.map((record: any) => (
                        <Card 
                            key={record.id} 
                            className="border-none bg-white shadow-xl shadow-slate-200/30 rounded-[1.5rem] lg:rounded-[2.2rem] overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer"
                            onClick={() => handleLoad(record.json)}
                        >
                            <CardHeader className="p-8 lg:p-10 border-b border-slate-50 bg-slate-50/20">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="px-2.5 py-1 rounded-lg bg-brand-navy text-white text-[9px] font-bold uppercase tracking-wider">
                                                {new Date(record.generatedAt).toLocaleDateString()}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(record.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-500">
                                            <Zap className="w-5 h-5 text-slate-300 group-hover:text-brand-green" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base lg:text-lg font-bold text-brand-navy group-hover:text-brand-green transition-colors leading-snug italic line-clamp-2">
                                        "{record.prompt}"
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 lg:p-10 bg-white">
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Architecture</p>
                                        <p className="text-xl font-bold text-brand-navy">{record.nodeCount} <span className="text-[10px] text-slate-500 font-semibold">Nodes</span></p>
                                    </div>
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Density</p>
                                        <p className="text-xl font-bold text-brand-navy">{record.edgeCount} <span className="text-[10px] text-slate-500 font-semibold">Edges</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                                        record.schemaValid 
                                            ? "bg-emerald-50 text-brand-green border-emerald-100" 
                                            : "bg-orange-50 text-orange-600 border-orange-100"
                                    )}>
                                        Schema: {record.schemaValid ? "Valid" : "Partial"}
                                    </div>
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                                        record.graphValid 
                                            ? "bg-emerald-50 text-brand-green border-emerald-100" 
                                            : "bg-red-50 text-red-600 border-red-100"
                                    )}>
                                        Graph: {record.graphValid ? "Secure" : "Issues"}
                                    </div>
                                    {record.repairsApplied.length > 0 && (
                                        <div className="px-4 py-1.5 rounded-full bg-brand-navy text-white text-[10px] font-bold uppercase tracking-widest flex items-center">
                                            <Wrench className="w-3 h-3 mr-2" />
                                            {record.repairsApplied.length} Fixes
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
