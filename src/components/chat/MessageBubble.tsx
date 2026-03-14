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
                "flex w-full mb-6 lg:mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn(
                "flex max-w-[92%] sm:max-w-[85%] lg:max-w-[75%]",
                isUser ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className={cn(
                    "flex-shrink-0 flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-[1rem] shadow-md transition-transform duration-300 hover:scale-105",
                    isUser 
                        ? "ml-3 lg:ml-4 bg-brand-navy text-white" 
                        : "mr-3 lg:mr-4 bg-white text-brand-green border border-slate-100"
                )}>
                    {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>

                {/* Content Bubble */}
                <div
                    className={cn(
                        "relative rounded-[1.5rem] px-6 py-5 lg:px-8 lg:py-6 text-sm lg:text-base border transition-all duration-300",
                        isUser
                            ? "bg-gradient-to-br from-brand-green/90 to-brand-green text-brand-navy border-brand-green/20 font-bold shadow-lg shadow-brand-green/10"
                            : "bg-white text-brand-navy border-slate-100 shadow-xl shadow-slate-200/40"
                    )}
                >
                    {/* Speech tail for high-end look */}
                    <div className={cn(
                        "absolute top-4 w-4 h-4 rotate-45 border-inherit",
                        isUser 
                            ? "-right-2 bg-brand-green border-r border-t" 
                            : "-left-2 bg-white border-l border-b"
                    )} />

                    <div className={cn(
                        "prose prose-sm lg:prose-base max-w-none break-words relative z-10",
                        "prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-strong:font-bold prose-headings:text-brand-navy prose-headings:font-bold prose-headings:tracking-tight",
                        isUser ? "[&_*]:text-brand-navy" : "[&_*]:text-slate-600 font-medium"
                    )}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed font-semibold lg:font-medium">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2.5">{children}</ol>,
                                li: ({ children }) => <li className="mb-2 font-semibold lg:font-medium">{children}</li>,
                                h1: ({ children }) => <h1 className="text-2xl font-bold mb-5 tracking-tight">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-bold mb-4 tracking-tight">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-lg font-bold mb-3 tracking-tight">{children}</h3>,
                                h4: ({ children }) => <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">{children}</h4>,
                                code: ({ node, inline, className, children, ...props }: any) => {
                                    return inline ? (
                                        <code className={cn(
                                            "px-2 py-0.5 rounded-lg font-mono text-[11px] lg:text-[12px] font-bold",
                                            isUser ? "bg-brand-navy/10 text-brand-navy" : "bg-emerald-50 text-brand-green"
                                        )} {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <pre className="p-5 lg:p-6 rounded-[1.2rem] bg-slate-950 border border-slate-800 overflow-x-auto my-6 custom-scrollbar shadow-inner">
                                            <code className="font-mono text-[11px] lg:text-[12px] leading-relaxed text-emerald-400/90" {...props}>
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
