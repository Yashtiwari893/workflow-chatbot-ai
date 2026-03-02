"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, FileJson, History, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "Chat Generator", href: "/", icon: MessageSquare },
    { name: "Sample Files", href: "/files", icon: FileJson },
    { name: "History", href: "/history", icon: History },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-card">
            <div className="flex h-16 items-center border-b border-border px-6">
                <h1 className="text-lg font-bold text-foreground">11za Flow Ai</h1>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
                <nav className="flex-1 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                                        "mr-3 h-5 w-5 flex-shrink-0"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t border-border p-4">
                <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                </button>
            </div>
        </div>
    )
}
