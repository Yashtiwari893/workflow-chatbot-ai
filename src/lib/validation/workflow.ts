import { z } from "zod";

// ─── 11za Node Data Schemas by tag ───────────────────────────────────────────

const textTagObjSchema = z.object({
    headercontent: z.string().optional().default(""),
    textContent: z.string(),
});

const buttonReplySchema = z.object({
    type: z.literal("reply"),
    reply: z.object({
        payload: z.string(),
        title: z.string(),
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
                buttons: z.array(buttonReplySchema),
            }),
        }),
    }),
    documentName: z.string().optional().default(""),
    subType: z.string().optional(),
});

const apiDataSchema = z.object({
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    url: z.string(),
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
        variable: z.string(),
        variableValue: z.string(),
    })
);

const conditionObjSchema = z.array(
    z.object({
        variable: z.string(),
        operator: z.string(),
        variableValue: z.string(),
    })
);

const variableObjSchema = z.array(
    z.object({
        variable: z.string(),
        variableValue: z.string(),
    })
);

// ─── Node Data (discriminated by tag) ────────────────────────────────────────

const nodeDataSchema = z.object({
    tag: z.enum([
        "SendText",
        "AskButton",
        "AskForm",
        "ApiRequest",
        "SetVariable",
        "Condition",
        "ResolveConversation",
    ]),
    // SendText
    textTagObj: textTagObjSchema.optional(),
    // AskButton
    selectInteractive: selectInteractiveSchema.optional(),
    storeVariable: z.string().optional(),
    attempt: z.number().optional(),
    validationerrorMsg: z.string().optional(),
    // ApiRequest
    apiData: apiDataSchema.optional(),
    storeResponseVariable: storeResponseVariableSchema.optional(),
    // SetVariable
    variableObj: variableObjSchema.optional(),
    // Condition
    operation: z.string().optional(),
    conditionObj: conditionObjSchema.optional(),
    // ResolveConversation
    resolveConversation: z.string().optional(),
});

// ─── Trigger node data (id = "1") ────────────────────────────────────────────

const triggerNodeDataSchema = z.object({
    selectEvent: z.string().default("inbound_message"),
    selectedPriority: z.string().default("1"),
    rulename: z.string(),
    expiryType: z.string().optional().default(""),
    expiryDate: z.string().optional().default(""),
    closeType: z.string().optional().default("minutes"),
    closeValue: z.number().optional().default(5),
    expiryMessage: z.string().optional().default(""),
    expMsgType: z.string().optional().default("text"),
    expiryInteractive: z.any().optional().nullable(),
    sessionExpMsg: z.string().optional().default(""),
    sheet: z.boolean().optional().default(false),
    googleSheetId: z.string().optional().default(""),
    googleSheetName: z.string().optional().default(""),
    status: z.boolean().optional().default(false),
    botread: z.boolean().optional().default(false),
    isCaseInsensitive: z.boolean().optional().default(true),
    conditions: z.array(z.any()).default([]),
});

// ─── Node Schema ──────────────────────────────────────────────────────────────

const elevenZaNodeSchema = z.object({
    id: z.string(),
    type: z.literal("html-template"),
    text: z.string().optional(),
    icon: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.union([nodeDataSchema, triggerNodeDataSchema]),
});

// ─── Edge Schema ──────────────────────────────────────────────────────────────

const elevenZaEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
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

const elevenZaVariableSchema = z.object({
    key: z.string(),
    type: z.enum(["String", "Number", "Object", "Array", "Boolean"]),
    value: z.string().default(""),
});

// ─── Root Workflow Schema ─────────────────────────────────────────────────────

export const workflowSchema = z.object({
    nodes: z.array(elevenZaNodeSchema).min(1),
    edges: z.array(elevenZaEdgeSchema),
    name: z.string().optional(),
    variables: z.array(elevenZaVariableSchema).optional().default([]),
    // These are optional as they are added at export time by 11za
    _id: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    __v: z.number().optional(),
    export: z.boolean().optional(),
    exportTime: z.number().optional(),
});

export type ElevenZaNode = z.infer<typeof elevenZaNodeSchema>;
export type ElevenZaEdge = z.infer<typeof elevenZaEdgeSchema>;
export type WorkflowData = z.infer<typeof workflowSchema>;

// ─── Metadata Analysis ────────────────────────────────────────────────────────

export function analyzeWorkflow(data: WorkflowData) {
    const nodeCount = data.nodes.length;

    const apiBlockCount = data.nodes.filter((n) => {
        const d = n.data as any;
        return d.tag === "ApiRequest";
    }).length;

    const conditionBlockCount = data.nodes.filter((n) => {
        const d = n.data as any;
        return d.tag === "Condition";
    }).length;

    return { nodeCount, apiBlockCount, conditionBlockCount };
}

// ─── Graph Integrity Checks ──────────────────────────────────────────────────

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
        errors.push("Duplicate node IDs detected.");
    }

    // Remove dangling edges (edges referencing non-existent nodes)
    const nodeIdSet = new Set(nodeIds);
    const validEdges = data.edges.filter((e) => {
        const valid = nodeIdSet.has(e.source) && nodeIdSet.has(e.target);
        if (!valid) errors.push(`Dangling edge removed: ${e.id}`);
        return valid;
    });

    return {
        valid: errors.length === 0,
        errors,
        fixed: { ...data, edges: validEdges },
    };
}
