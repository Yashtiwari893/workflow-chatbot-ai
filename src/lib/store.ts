import { create } from "zustand";

interface WorkflowStore {
    activeJson: string;
    setActiveJson: (json: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
    activeJson: "{\n  \"nodes\": [],\n  \"edges\": []\n}",
    setActiveJson: (json: string) => set({ activeJson: json }),
    isLoading: false,
    setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));
