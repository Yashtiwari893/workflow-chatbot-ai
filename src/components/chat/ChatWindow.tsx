"use client"

import * as React from "react"
import { MessageBubble } from "./MessageBubble"
import { Send, Loader } from "lucide-react"
import { useWorkflowStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
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
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [input])

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
        <div className="flex w-full flex-col h-full bg-white overflow-hidden border-r border-slate-200">
            <div className="flex-1 overflow-y-auto w-full p-6 lg:p-8 space-y-6 custom-scrollbar bg-white">
                {messages.map((message) => (
                    <MessageBubble key={message.id} role={message.role} content={message.content} />
                ))}
                {isLoading && (
                    <div className="flex flex-col space-y-4 p-2">
                        <div className="flex items-center space-x-3 text-slate-400 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                <Loader className="w-4 h-4 animate-spin" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                Processing Neural Graph
                            </span>
                        </div>
                    </div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex w-full items-end space-x-3"
                >
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green/20 transition-all duration-150">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            className="w-full min-h-[44px] max-h-32 overflow-y-auto resize-none bg-transparent border-none px-4 py-3 text-[14px] text-slate-900 focus:ring-0 outline-none focus:outline-none placeholder:text-slate-400 font-medium"
                            placeholder="Type a workflow requirement..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            disabled={isLoading}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        variant="premium"
                        size="icon"
                        className="rounded-lg h-11 w-11 shadow-sm transition-all hover:opacity-90 active:scale-95"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </Button>
                </form>
                <div className="mt-3 flex justify-center">
                    <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Shift + Enter for new line</p>
                </div>
            </div>
        </div>
    )
}
