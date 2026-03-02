import { z } from "zod";

export const edgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional().nullable(),
    targetHandle: z.string().optional().nullable(),
});

export const nodeSchema = z.object({
    id: z.string(),
    type: z.string().optional().nullable(),
    position: z.object({ x: z.number(), y: z.number() }).optional().nullable(),
    data: z.any().optional().nullable(),
});

export const workflowSchema = z.object({
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
});

export type WorkflowEdge = z.infer<typeof edgeSchema>;
export type WorkflowNode = z.infer<typeof nodeSchema>;
export type WorkflowData = z.infer<typeof workflowSchema>;

export function analyzeWorkflow(data: WorkflowData) {
    const nodeCount = data.nodes.length;
    const apiBlockCount = data.nodes.filter((n) => n.id.includes("api") || n.type === "api").length;
    const conditionBlockCount = data.nodes.filter((n) => n.id.includes("condition") || n.type === "condition").length;

    return { nodeCount, apiBlockCount, conditionBlockCount };
}
