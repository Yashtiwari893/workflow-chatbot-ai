"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, CheckCircle2, AlertCircle, Wrench, Trash2 } from "lucide-react"
import { useWorkflowStore } from "@/lib/store"
// Button component is minimal — use plain button for variant styling

export default function HistoryPage() {
    const { history, clearHistory, setActiveJson } = useWorkflowStore()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="p-8 h-full bg-background" />;
    }

    const handleLoad = (json: string) => {
        setActiveJson(json)
        // Navigate to main page
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
        <div className="flex flex-col p-8 h-full space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Generation History</h2>
                    <p className="text-muted-foreground">
                        Previously generated AI workflow JSONs — stored locally in your browser.
                    </p>
                </div>
                {history.length > 0 && (
                    <button
                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-secondary transition-colors"
                        onClick={() => {
                            if (confirm("Clear all history? This cannot be undone.")) {
                                clearHistory()
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear History
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
                    <p className="text-muted-foreground text-sm">No generations yet.</p>
                    <p className="text-muted-foreground text-xs mt-1">
                        Generate a workflow from the Chat Generator page and it will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {history.map((record) => (
                        <Card
                            key={record.id}
                            className="hover:shadow-md transition-shadow cursor-pointer group border-border"
                            onClick={() => handleLoad(record.json)}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-start justify-between gap-2">
                                    <span className="line-clamp-2 flex-1">{record.prompt}</span>
                                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {formatDate(record.generatedAt)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Stats row */}
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                    <span>{record.nodeCount} nodes</span>
                                    <span>·</span>
                                    <span>{record.edgeCount} edges</span>
                                </div>

                                {/* Validation badges */}
                                <div className="flex gap-2 flex-wrap">
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${record.schemaValid
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-amber-500/15 text-amber-400"
                                            }`}
                                    >
                                        {record.schemaValid ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        Schema {record.schemaValid ? "Valid" : "Partial"}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${record.graphValid
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-amber-500/15 text-amber-400"
                                            }`}
                                    >
                                        {record.graphValid ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3" />
                                        )}
                                        Graph {record.graphValid ? "Valid" : "Repaired"}
                                    </span>
                                    {record.repairsApplied.length > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-400">
                                            <Wrench className="w-3 h-3" />
                                            {record.repairsApplied.length} fix{record.repairsApplied.length > 1 ? "es" : ""}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to load this workflow →
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
