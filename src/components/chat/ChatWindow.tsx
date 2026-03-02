"use client"

import * as React from "react"
import { MessageBubble } from "./MessageBubble"
import { Send, Loader } from "lucide-react"
import { useWorkflowStore } from "@/lib/store"

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
}

export function ChatWindow() {
    const { setActiveJson, isLoading, setIsLoading } = useWorkflowStore()
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I am 11za Flow Ai. Describe the workflow you want to create or edit."
        }
    ])
    const [input, setInput] = React.useState("")

    const handleSend = async () => {
        if (!input.trim() || isLoading) return
        const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", content: input }
        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMessage.content })
            })
            const data = await res.json()

            let replyContent = ""
            if (data.error) {
                replyContent = `Error: ${data.error}`
            } else {
                replyContent = "I have drafted the JSON logic based on your requirement."
                if (data.data) {
                    setActiveJson(JSON.stringify(data.data, null, 2))
                }
            }

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: replyContent,
            }
            setMessages((prev) => [...prev, aiMessage])
        } catch {
            setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "A network error occurred." }])
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
                    <div className="flex items-center space-x-2 text-muted-foreground animate-pulse p-4">
                        <Loader className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Analyzing requirements...</span>
                    </div>
                )}
            </div>

            <div className="p-4 bg-background border-t border-border">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex w-full items-center space-x-2"
                >
                    <input
                        type="text"
                        className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                        placeholder="E.g., create an OTP verification flow with WhatsApp fallback..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary text-primary-foreground h-11 w-11 transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
