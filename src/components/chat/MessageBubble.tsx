import * as React from "react"
import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export interface MessageBubbleProps {
    role: "user" | "assistant"
    content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === "user"

    return (
        <div
            className={cn(
                "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn(
                "flex max-w-[85%] sm:max-w-[75%]",
                isUser ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className={cn(
                    "flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full shadow-sm",
                    isUser 
                        ? "ml-3 bg-primary text-primary-foreground" 
                        : "mr-3 bg-secondary text-primary border border-border"
                )}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Content Bubble */}
                <div
                    className={cn(
                        "relative rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all",
                        isUser
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-card text-foreground border border-border/50 rounded-tl-none"
                    )}
                >
                    <div className={cn(
                        "prose prose-sm dark:prose-invert max-w-none break-words",
                        "prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-code:text-primary-foreground/90",
                        isUser ? "[&_*]:text-primary-foreground" : "[&_*]:text-foreground"
                    )}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                code: ({ node, inline, className, children, ...props }: any) => {
                                    return inline ? (
                                        <code className="bg-black/20 px-1 rounded font-mono text-xs" {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <pre className="p-2 rounded bg-muted/50 overflow-x-auto my-2">
                                            <code className="font-mono text-xs" {...props}>
                                                {children}
                                            </code>
                                        </pre>
                                    )
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    )
}
