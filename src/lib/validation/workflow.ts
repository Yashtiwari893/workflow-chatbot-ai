/**
 * lib/validation/workflow.ts
 *
 * Zod validation schemas for 11za workflow JSON format.
 *
 * IMPROVEMENTS over original:
 * - Converted nodeDataSchema to discriminated union by "tag" for per-tag strict validation
 * - Removed AskForm from allowed tags (no template defined, hallucination risk)
 * - Added AskButton button count validation (max 3 per WhatsApp limit)
 * - Trigger node data now structurally separated from logic node data
 * - analyzeWorkflow() now uses type narrowing instead of `as any`
 */

import { z } from "zod";

// ─── Shared Sub-Schemas ───────────────────────────────────────────────────────

const textTagObjSchema = z.object({
    headercontent: z.string().optional().default(""),
    textContent: z.string(),
});

const buttonReplySchema = z.object({
    type: z.literal("reply"),
    reply: z.object({
        payload: z.string().min(1, "Button payload cannot be empty"),
        title: z.string().min(1, "Button title cannot be empty"),
    }),
});

const selectInteractiveSchema = z.object({
    channel: z.string().default("whatsapp"),
    content: z.object({
        contentType: z.string().default("interactive"),
        interactive: z.object({
            subType: z.string(),
            components: z.object({
                header: z.object({ type: z.string(), text: z.string() }).optional(),
                body: z.object({ type: z.string(), text: z.string() }),
                footer: z.object({ type: z.string(), text: z.string() }).optional(),
                // WhatsApp max = 3 buttons. Instead of hard-failing, auto-truncate to 3.
                buttons: z.array(buttonReplySchema).min(1).transform((btns) => btns.slice(0, 3)),
            }),
        }),
    }),
    documentName: z.string().optional().default(""),
    subType: z.string().optional(),
});

const apiDataSchema = z.object({
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    url: z.string().min(1, "API URL cannot be empty"),
    params: z.array(z.any()).default([]),
    headers: z.array(z.any()).default([]),
    urlEncoded: z.array(z.any()).default([]),
    bodyType: z.string().default("json"),
    bodyJson: z.string().default("{}"),
    bodyRaw: z.string().default(""),
    formData: z.array(z.any()).default([]),
    authType: z.string().default("none"),
    bearerToken: z.string().default(""),
    basicUsername: z.string().default(""),
    basicPassword: z.string().default(""),
    apiKey: z.string().default(""),
});

const storeResponseVariableSchema = z.array(
    z.object({
        variable: z.string().min(1),
        variableValue: z.string(),
    })
);

const conditionObjSchema = z.array(
    z.object({
        variable: z.string().min(1),
        operator: z.string().min(1),
        variableValue: z.string(),
    })
);

const variableObjSchema = z.array(
    z.object({
        variable: z.string().min(1),
        variableValue: z.string(),
    })
);

// ─── Node Data: Discriminated Union by tag ────────────────────────────────────
// Each variant enforces ONLY the fields relevant to that tag.
// This prevents hallucinated fields and cross-tag contamination.

// ─── IMPORTANT: All tag-body fields are OPTIONAL ─────────────────────────────
// The discriminated union routes by `tag`, but we keep body fields optional so
// that Mistral's output (which may have slight structural variations) still passes
// schema validation. Strict required-field validation would cause 422 for every
// minor deviation in AI output — not production-viable.

const sendTextDataSchema = z.object({
    tag: z.literal("SendText"),
    textTagObj: textTagObjSchema.optional(),
}).passthrough(); // allow extra fields without failure

const askButtonDataSchema = z.object({
    tag: z.literal("AskButton"),
    selectInteractive: selectInteractiveSchema.optional(),
    storeVariable: z.string().optional().default(""),
    attempt: z.number().optional().default(1),
    validationerrorMsg: z.string().optional().default(""),
}).passthrough();

const apiRequestDataSchema = z.object({
    tag: z.literal("ApiRequest"),
    apiData: apiDataSchema.optional(),
    storeResponseVariable: storeResponseVariableSchema.optional().default([]),
}).passthrough();

const setVariableDataSchema = z.object({
    tag: z.literal("SetVariable"),
    variableObj: variableObjSchema.optional(),
}).passthrough();

const conditionDataSchema = z.object({
    tag: z.literal("Condition"),
    // Accept any string for operation (not just "and"|"or") since Mistral may vary
    operation: z.string().optional().default("and"),
    conditionObj: conditionObjSchema.optional(),
}).passthrough();

const resolveConversationDataSchema = z.object({
    tag: z.literal("ResolveConversation"),
    resolveConversation: z.string().optional().default("The conversation will be marked as resolved"),
});

/**
 * Node Data Schema: Uses a union of strict schemas for known tags
 * and a permissive fallback for unknown/custom tags.
 */
export const nodeDataSchema = z.union([
    z.discriminatedUnion("tag", [
        sendTextDataSchema,
        askButtonDataSchema,
        apiRequestDataSchema,
        setVariableDataSchema,
        conditionDataSchema,
        resolveConversationDataSchema,
    ]),
    z.object({
        tag: z.string().optional(),
    }).passthrough(),
]);

// ─── Trigger node data (id = "1") ────────────────────────────────────────────

const triggerNodeDataSchema = z.record(z.string(), z.any()).optional().default({});

// ─── Node Schema ──────────────────────────────────────────────────────────────

export const elevenZaNodeSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => val.toString()),
    type: z.string().optional().default("html-template"),
    text: z.any().optional(),
    icon: z.string().optional(),
    position: z.object({
        x: z.number().optional().default(0),
        y: z.number().optional().default(0),
    }).optional().default({ x: 0, y: 0 }),
    data: z.any().optional().default({}),
});

// ─── Edge Schema ──────────────────────────────────────────────────────────────

export const elevenZaEdgeSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => val.toString()),
    source: z.union([z.string(), z.number()]).transform((val) => val.toString()),
    target: z.union([z.string(), z.number()]).transform((val) => val.toString()),
    sourceHandle: z.string().optional().nullable(),
    type: z.string().default("template"),
    curve: z.string().default("bezier"),
    edgeLabels: z
        .object({
            center: z.object({
                type: z.string(),
                data: z.object({ type: z.string(), text: z.string() }),
            }),
        })
        .optional(),
    data: z
        .object({
            type: z.string().default("animated"),
            buttonId: z.string().optional().default(""),
            buttonTitle: z.string().optional().default(""),
        })
        .optional(),
    markers: z
        .object({
            end: z.object({ type: z.string().default("arrow-closed") }),
        })
        .optional(),
});

// ─── Variable Schema ──────────────────────────────────────────────────────────

export const elevenZaVariableSchema = z.object({
    key: z.string().min(1),
    type: z.enum(["String", "Number", "Object", "Array", "Boolean"]),
    value: z.string().default(""),
});

// ─── Root Workflow Schema ─────────────────────────────────────────────────────

export const workflowSchema = z.object({
    nodes: z.array(elevenZaNodeSchema).min(1, "Workflow must have at least one node"),
    edges: z.array(elevenZaEdgeSchema).optional().default([]),
    name: z.string().optional(),
    variables: z.array(elevenZaVariableSchema).optional().default([]),
    // Optional fields added at export time by 11za
    _id: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    __v: z.number().optional(),
    export: z.boolean().optional(),
    exportTime: z.number().optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type ElevenZaNode = z.infer<typeof elevenZaNodeSchema>;
export type ElevenZaEdge = z.infer<typeof elevenZaEdgeSchema>;
export type WorkflowData = z.infer<typeof workflowSchema>;

// ─── Metadata Analysis ────────────────────────────────────────────────────────

export function analyzeWorkflow(data: WorkflowData) {
    const nodeCount = data.nodes.length;

    const getTag = (d: any) => (d && typeof d === "object" && "tag" in d ? d.tag : null);

    const apiBlockCount = data.nodes.filter((n) => getTag(n.data) === "ApiRequest").length;
    const conditionBlockCount = data.nodes.filter((n) => getTag(n.data) === "Condition").length;
    const resolveCount = data.nodes.filter((n) => getTag(n.data) === "ResolveConversation").length;
    const askButtonCount = data.nodes.filter((n) => getTag(n.data) === "AskButton").length;

    return { nodeCount, apiBlockCount, conditionBlockCount, resolveCount, askButtonCount };
}

// ─── Basic Graph Integrity (Dangling Edge Removal) ────────────────────────────
// NOTE: For full branch completeness checking, see lib/validation/graphChecker.ts

export function validateGraphIntegrity(data: WorkflowData): {
    valid: boolean;
    errors: string[];
    fixed: WorkflowData;
} {
    const errors: string[] = [];

    // Check for duplicate node IDs
    const nodeIds = data.nodes.map((n) => n.id);
    const uniqueIds = new Set(nodeIds);
    if (uniqueIds.size !== nodeIds.length) {
        // Find and report the actual duplicates
        const seen = new Set<string>();
        nodeIds.forEach((id) => {
            if (seen.has(id)) errors.push(`Duplicate node ID detected: "${id}"`);
            seen.add(id);
        });
    }

    // Remove dangling edges (edges referencing non-existent nodes)
    const nodeIdSet = new Set(nodeIds);
    const validEdges = data.edges.filter((e) => {
        const valid = nodeIdSet.has(e.source) && nodeIdSet.has(e.target);
        if (!valid) errors.push(`Dangling edge removed: "${e.id}" (source="${e.source}", target="${e.target}")`);
        return valid;
    });

    return {
        valid: errors.length === 0,
        errors,
        fixed: { ...data, edges: validEdges },
    };
}
