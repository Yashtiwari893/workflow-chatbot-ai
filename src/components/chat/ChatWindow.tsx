"use client"

import * as React from "react"
import { MessageBubble } from "./MessageBubble"
import { Send, Loader } from "lucide-react"
import { useWorkflowStore } from "@/lib/store"
import type { GenerationRecord } from "@/lib/store"

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
}

export function ChatWindow() {
    const { setActiveJson, isLoading, setIsLoading, addToHistory } = useWorkflowStore()
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        {
            id: "init-1",
            role: "assistant",
            content:
                "Hello! I am 11za Flow Ai 🤖\n\nDescribe the chatbot workflow you want to create and I'll generate a complete, valid JSON for the 11za platform.\n\nExample: \"Create an OTP verification flow that calls my API and shows a success or failure message\"",
        },
    ])
    const [input, setInput] = React.useState("")

    // Auto-scroll to bottom on new messages
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    React.useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userContent = input.trim()
        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: userContent,
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userContent }),
            })

            const data = await res.json()

            let replyContent = ""

            if (!res.ok || data.error) {
                replyContent = `❌ Error: ${data.error || "Something went wrong."}`
                if (data.details) {
                    replyContent += `\n\nSchema Issues:\n${JSON.stringify(data.details, null, 2)}`
                }
            } else {
                const m = data.metadata
                const repairLines =
                    m?.repairsApplied?.length > 0
                        ? `\n\n🔧 Auto-Repairs Applied:\n${m.repairsApplied.map((r: string) => `• ${r}`).join("\n")}`
                        : ""
                const failLines =
                    m?.repairsFailed?.length > 0
                        ? `\n\n⚠️ Needs Manual Review:\n${m.repairsFailed.map((r: string) => `• ${r}`).join("\n")}`
                        : ""
                const summaryLines = m?.summary
                    ? `\n  • API calls: ${m.summary.apiRequestCount}  • Conditions: ${m.summary.conditionCount}  • Buttons: ${m.summary.askButtonCount}  • Resolvers: ${m.summary.resolveConversationCount}`
                    : ""

                replyContent = [
                    `### ✅ 11za Workflow Generated!`,
                    ``,
                    `#### 📊 Stats:`,
                    `- **Nodes:** ${m?.nodeCount ?? 0}  `,
                    `- **Edges:** ${m?.edgeCount ?? 0}${summaryLines ? `  \n- **Details:** ${summaryLines}` : ""}`,
                    `- **Schema Valid:** ${m?.schemaValid ? "✅ Yes" : "⚠️ Partial"}`,
                    `- **Graph Valid:** ${m?.graphValid ? "✅ Yes" : "⚠️ Issues found"}`,
                    repairLines ? `\n#### 🔧 Auto-Repairs Applied:\n${m.repairsApplied.map((r: string) => `- ${r}`).join("\n")}` : "",
                    failLines ? `\n#### ⚠️ Needs Manual Review:\n${m.repairsFailed.map((r: string) => `- ${r}`).join("\n")}` : "",
                    ``,
                    `> Ready to copy or download for 11za import! 🚀`,
                ]
                    .filter((l) => l !== undefined)
                    .join("\n")
                    .trim()

                if (data.data) {
                    const jsonStr = JSON.stringify(data.data, null, 2)
                    setActiveJson(jsonStr)

                    // Record to history
                    const record: GenerationRecord = {
                        id: `gen-${Date.now()}`,
                        prompt: userContent,
                        outline: m?.outline ?? "",
                        json: jsonStr,
                        nodeCount: m?.nodeCount ?? 0,
                        edgeCount: m?.edgeCount ?? 0,
                        schemaValid: m?.schemaValid ?? false,
                        graphValid: m?.graphValid ?? false,
                        repairsApplied: m?.repairsApplied ?? [],
                        generatedAt: new Date().toISOString(),
                    }
                    addToHistory(record)
                }
            }

            const aiMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: "assistant",
                content: replyContent,
            }
            setMessages((prev) => [...prev, aiMessage])
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg-${Date.now()}`,
                    role: "assistant",
                    content: "❌ A network error occurred. Please check your connection and try again.",
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex w-full flex-col h-full bg-card shadow overflow-hidden">
            <div className="flex-1 overflow-y-auto w-full p-4 space-y-4">
                {messages.map((message) => (
                    <MessageBubble key={message.id} role={message.role} content={message.content} />
                ))}
                {isLoading && (
                    <div className="flex flex-col space-y-2 p-4">
                        <div className="flex items-center space-x-3 text-primary animate-pulse">
                            <Loader className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">
                                {messages.length % 2 === 0 ? "Analyzing requirements..." : "Generating 11za workflow..."}
                            </span>
                        </div>
                        <div className="flex space-x-1 pl-8">
                            <div className="h-1 w-1 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-1 w-1 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-1 w-1 bg-primary/40 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-background border-t border-border">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex w-full items-end space-x-2"
                >
                    <textarea
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm transition-all"
                        placeholder="Describe your workflow in detail..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        disabled={isLoading}
                        aria-label="Workflow description input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary text-primary-foreground h-11 w-11 flex-shrink-0 transition-colors hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                        aria-label="Send"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
