import * as React from "react"
import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"

export interface MessageBubbleProps {
    role: "user" | "assistant"
    content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === "user"

    return (
        <div
            className={cn(
                "flex w-full space-x-4 p-4",
                isUser ? "justify-end bg-background" : "justify-start bg-secondary/50 rounded-lg"
            )}
        >
            {!isUser && (
                <div className="flex-shrink-0 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Bot className="h-5 w-5" />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[75%] rounded-lg p-3 text-sm flex flex-col gap-2",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-foreground"
                )}
            >
                <span className="whitespace-pre-wrap">{content}</span>
            </div>
            {isUser && (
                <div className="flex-shrink-0 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    )
}
