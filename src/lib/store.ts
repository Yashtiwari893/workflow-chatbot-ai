/**
 * lib/store.ts
 *
 * Zustand store for 11za workflow chatbot state.
 *
 * IMPROVEMENTS over original:
 * - Added GenerationRecord type to track generation history
 * - History persisted to localStorage via Zustand persist middleware
 * - Added addToHistory() and clearHistory() actions
 * - Added generationCount for display in UI
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GenerationRecord {
    id: string;
    prompt: string;
    outline: string;
    json: string;
    nodeCount: number;
    edgeCount: number;
    schemaValid: boolean;
    graphValid: boolean;
    repairsApplied: string[];
    generatedAt: string; // ISO date string
}

interface WorkflowStore {
    // ── Current session ──────────────────────────────────────────────────────
    activeJson: string;
    setActiveJson: (json: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // ── Generation history (persisted to localStorage) ────────────────────────
    history: GenerationRecord[];
    addToHistory: (record: GenerationRecord) => void;
    clearHistory: () => void;
    generationCount: number;

    // ── UI State ─────────────────────────────────────────────────────────────
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
    persist(
        (set) => ({
            // ── Current session defaults ──────────────────────────────────────
            activeJson: '{\n  "nodes": [],\n  "edges": []\n}',
            setActiveJson: (json: string) => set({ activeJson: json }),
            isLoading: false,
            setIsLoading: (loading: boolean) => set({ isLoading: loading }),

            // ── History ───────────────────────────────────────────────────────
            history: [],
            generationCount: 0,
            addToHistory: (record: GenerationRecord) =>
                set((state) => ({
                    // Keep last 50 records to avoid localStorage bloat
                    history: [record, ...state.history].slice(0, 50),
                    generationCount: state.generationCount + 1,
                })),
            clearHistory: () => set({ history: [], generationCount: 0 }),

            // ── UI State ─────────────────────────────────────────────────────
            isSidebarOpen: true,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
        }),
        {
            name: "11za-workflow-store", // localStorage key
            // Only persist history and generationCount; do NOT persist transient UI state
            partialize: (state) => ({
                history: state.history,
                generationCount: state.generationCount,
            }),
        }
    )
);
