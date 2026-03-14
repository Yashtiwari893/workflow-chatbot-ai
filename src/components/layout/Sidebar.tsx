"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, FileJson, History, ChevronLeft, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/lib/store"

const navigation = [
    { name: "Chat Generator", href: "/", icon: MessageSquare },
    { name: "Sample Files", href: "/files", icon: FileJson },
    { name: "History", href: "/history", icon: History },
]

export function Sidebar() {
    const pathname = usePathname()
    const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useWorkflowStore()

    // Close sidebar on navigation (mobile behavior)
    React.useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false)
        }
    }, [pathname, setSidebarOpen])

    return (
        <>
            {/* Mobile Header Overlay Trigger */}
            {!isSidebarOpen && (
                <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-30 shadow-sm">
                    <Link href="/" className="flex items-center">
                        <img 
                            src="https://11za.com/wp-content/themes/one-1za/assets/images/logo/11za_logo.svg" 
                            alt="11za Logo" 
                            className="h-7 w-auto"
                        />
                    </Link>
                    <button 
                        onClick={toggleSidebar}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 hover:text-brand-navy"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Sidebar Shell */}
            <aside 
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-100 bg-white transition-all duration-500 ease-in-out lg:static",
                    isSidebarOpen ? "w-[280px] translate-x-0" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
                )}
            >
                {/* Brand Header */}
                <div className={cn(
                    "flex items-center border-b border-slate-50 transition-all duration-500",
                    isSidebarOpen ? "h-24 px-8 justify-between" : "h-24 justify-center"
                )}>
                    {isSidebarOpen && (
                        <Link href="/" className="flex items-center animate-in fade-in slide-in-from-left-2 duration-700">
                            <img 
                                src="https://11za.com/wp-content/themes/one-1za/assets/images/logo/11za_logo.svg" 
                                alt="11za Logo" 
                                className="h-9 w-auto"
                            />
                        </Link>
                    )}
                    
                    <button 
                        onClick={toggleSidebar}
                        className={cn(
                            "w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-brand-navy hover:bg-white hover:shadow-sm transition-all",
                            !isSidebarOpen && "lg:w-12 lg:h-12"
                        )}
                    >
                        {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 space-y-2 px-4 pt-10">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center transition-all duration-300 rounded-2xl relative",
                                    isActive
                                        ? "bg-brand-green-light text-brand-green"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-brand-navy",
                                    isSidebarOpen ? "px-5 py-4 text-sm font-semibold" : "p-4 justify-center"
                                )}
                                title={!isSidebarOpen ? item.name : ""}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
                                        isActive ? "text-brand-green" : "text-slate-400 group-hover:text-brand-navy",
                                        isSidebarOpen ? "mr-4" : "mr-0"
                                    )}
                                />
                                {isSidebarOpen && (
                                    <span className="animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap">{item.name}</span>
                                )}
                                {isActive && !isSidebarOpen && (
                                    <div className="absolute left-0 w-1 h-6 bg-brand-green rounded-r-full" />
                                )}
                            </Link>
                        )
                    })}
                </nav>


            </aside>

            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-brand-navy/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    )
}
