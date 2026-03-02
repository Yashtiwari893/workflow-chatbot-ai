import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "11za Flow Ai - JSON Workflow Generator",
  description: "Generate and manage React Flow JSON workflows using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background antialiased text-foreground flex`}>
        <Sidebar />
        <main className="flex-1 w-full h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
