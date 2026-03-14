/**
 * lib/flow/repair.ts
 *
 * Auto-repair engine for 11za workflow JSON.
 *
 * Attempts to automatically fix common structural issues in AI-generated workflows
 * without altering the business logic intent. Returns a repaired copy of the workflow
 * and a log of all changes made.
 *
 * REPAIRS IMPLEMENTED:
 * R1: Missing ResolveConversation → append one, connect all dead-end nodes to it
 * R2: Missing success/fail edge on ApiRequest or Condition → connect to nearest ResolveConversation
 * R3: Duplicate node IDs → re-stamp duplicates with fresh timestamps
 * R4: Duplicate edge IDs → re-generate edge ID from source + target + handle
 *
 * REPAIRS NOT ATTEMPTED (require human review):
 * - Missing AskButton button edges (would require knowing where each button should go)
 * - Orphan nodes with complex branching context
 */

import type { WorkflowData, ElevenZaNode, ElevenZaEdge } from "@/lib/validation/workflow";
import type { GraphCheckResult } from "@/lib/validation/graphChecker";

export interface RepairResult {
    repaired: WorkflowData;
    repairsApplied: string[];
    repairsFailed: string[];
}

// ─── ID generation helpers ────────────────────────────────────────────────────

let _idCounter = 0;

function nextTimestampId(): string {
    // Use current timestamp + counter to guarantee uniqueness even in the same ms
    return (Date.now() + _idCounter++).toString();
}

function buildEdgeId(source: string, target: string, handle?: string): string {
    if (!handle) return `${source}-${target}--`;
    if (handle === "success::true") return `${source}-${target}-success-`;
    if (handle === "fail::false") return `${source}-${target}-fail-`;
    return `${source}-${target}-${handle}-`;
}

function makeResolveNode(id: string, x: number, y: number): ElevenZaNode {
    return {
        id,
        type: "html-template" as const,
        text: `Node ${id}`,
        position: { x, y },
        data: {
            tag: "ResolveConversation" as const,
            resolveConversation: "The conversation will be marked as resolved",
        },
    };
}

function makeSimpleEdge(source: string, target: string): ElevenZaEdge {
    return {
        id: buildEdgeId(source, target),
        source,
        target,
        type: "template",
        curve: "bezier",
        edgeLabels: { center: { type: "html-template", data: { type: "text", text: "Connected" } } },
        data: { type: "animated", buttonId: "", buttonTitle: "" },
        markers: { end: { type: "arrow-closed" } },
    };
}

function makeSuccessEdge(source: string, target: string): ElevenZaEdge {
    return {
        id: buildEdgeId(source, target, "success::true"),
        source,
        target,
        sourceHandle: "success::true",
        type: "template",
        curve: "bezier",
        edgeLabels: { center: { type: "html-template", data: { type: "text", text: "true" } } },
        data: { type: "animated", buttonId: "success", buttonTitle: "true" },
        markers: { end: { type: "arrow-closed" } },
    };
}

function makeFailEdge(source: string, target: string): ElevenZaEdge {
    return {
        id: buildEdgeId(source, target, "fail::false"),
        source,
        target,
        sourceHandle: "fail::false",
        type: "template",
        curve: "bezier",
        edgeLabels: { center: { type: "html-template", data: { type: "text", text: "false" } } },
        data: { type: "animated", buttonId: "fail", buttonTitle: "false" },
        markers: { end: { type: "arrow-closed" } },
    };
}

function makeButtonEdge(source: string, target: string, payload: string, title: string): ElevenZaEdge {
    return {
        id: buildEdgeId(source, target, payload),
        source,
        target,
        sourceHandle: `${payload}::${title}`,
        type: "template",
        curve: "bezier",
        edgeLabels: { center: { type: "html-template", data: { type: "text", text: title } } },
        data: { type: "animated", buttonId: payload, buttonTitle: title },
        markers: { end: { type: "arrow-closed" } },
    };
}

// ─── Main Repair Function ─────────────────────────────────────────────────────

export function autoRepairFlow(data: WorkflowData, checkResult: GraphCheckResult): RepairResult {
    // Reset counter at start of each repair session
    _idCounter = 0;

    const repairsApplied: string[] = [];
    const repairsFailed: string[] = [];

    // Deep clone to avoid mutating the original
    let nodes: ElevenZaNode[] = JSON.parse(JSON.stringify(data.nodes));
    let edges: ElevenZaEdge[] = JSON.parse(JSON.stringify(data.edges));

    // ── R3: Fix duplicate node IDs ────────────────────────────────────────────
    const seenIds = new Set<string>();
    nodes = nodes.map((node) => {
        if (seenIds.has(node.id)) {
            const newId = nextTimestampId();
            repairsApplied.push(`Duplicate node ID "${node.id}" re-stamped to "${newId}".`);
            // Update any edges that referenced the old ID
            edges = edges.map((e) => ({
                ...e,
                source: e.source === node.id ? newId : e.source,
                target: e.target === node.id ? newId : e.target,
            }));
            return { ...node, id: newId };
        }
        seenIds.add(node.id);
        return node;
    });

    // ── R4: Fix duplicate edge IDs ────────────────────────────────────────────
    const seenEdgeIds = new Set<string>();
    edges = edges.map((edge) => {
        if (seenEdgeIds.has(edge.id)) {
            const newId = buildEdgeId(edge.source, edge.target, edge.sourceHandle ?? undefined) + `${Date.now()}`;
            repairsApplied.push(`Duplicate edge ID "${edge.id}" re-generated to "${newId}".`);
            return { ...edge, id: newId };
        }
        seenEdgeIds.add(edge.id);
        return edge;
    });

    // ── R1: Ensure at least one ResolveConversation node exists ──────────────
    const resolveNodes = nodes.filter(
        (n) => "tag" in n.data && n.data.tag === "ResolveConversation"
    );

    let primaryResolveId: string;

    if (resolveNodes.length === 0) {
        // Find the rightmost node to position the resolve node after it
        const maxX = nodes.reduce((acc, n) => Math.max(acc, n.position.x), 0);
        const maxY = nodes.reduce((acc, n) => Math.max(acc, n.position.y), 0);

        primaryResolveId = nextTimestampId();
        const resolveNode = makeResolveNode(primaryResolveId, maxX + 300, maxY);
        nodes.push(resolveNode);
        repairsApplied.push(
            `Added missing ResolveConversation node "${primaryResolveId}".`
        );
    } else {
        primaryResolveId = resolveNodes[0].id;
    }

    // ── Build outgoing edge set for current state ─────────────────────────────
    const getOutgoingEdges = (nodeId: string) =>
        edges.filter((e) => e.source === nodeId);

    const getSourceHandles = (nodeId: string): Set<string> =>
        new Set(getOutgoingEdges(nodeId).map((e) => e.sourceHandle ?? ""));

    // ── R2: Fix missing success/fail edges on ApiRequest and Condition nodes ──
    for (const node of nodes) {
        const tag = "tag" in node.data ? node.data.tag : null;
        if (tag !== "ApiRequest" && tag !== "Condition") continue;

        const handles = getSourceHandles(node.id);

        if (!handles.has("success::true")) {
            const edge = makeSuccessEdge(node.id, primaryResolveId);
            edges.push(edge);
            repairsApplied.push(
                `Added missing success edge for ${tag} node "${node.id}" → resolved via "${primaryResolveId}".`
            );
        }

        if (!handles.has("fail::false")) {
            const edge = makeFailEdge(node.id, primaryResolveId);
            edges.push(edge);
            repairsApplied.push(
                `Added missing fail edge for ${tag} node "${node.id}" → resolved via "${primaryResolveId}".`
            );
        }
    }

    // ── R1b: Connect dead-end nodes (not ResolveConversation) to resolve ─────
    for (const node of nodes) {
        const tag = "tag" in node.data ? node.data.tag : null;
        if (tag === "ResolveConversation") continue;

        const outEdges = getOutgoingEdges(node.id);
        // Only fix simple dead-ends (already handled branching nodes above)
        if (outEdges.length === 0 && tag !== "ApiRequest" && tag !== "Condition") {
            const edge = makeSimpleEdge(node.id, primaryResolveId);
            edges.push(edge);
            repairsApplied.push(
                `Connected dead-end node "${node.id}" (${tag ?? "trigger"}) to ResolveConversation "${primaryResolveId}".`
            );
        }
    }

    // ── R5: Fix missing button edges for AskButton nodes ─────────────────────
    for (const missing of checkResult.summary.missingBranches) {
        if (missing.tag === "AskButton") {
            // Find the button title for this payload
            const node = nodes.find((n) => n.id === missing.nodeId);
            const buttons = (node?.data as any)?.selectInteractive?.content?.interactive?.components?.buttons ?? [];
            const button = buttons.find((b: any) => b.reply?.payload === missing.missingBranch);
            const title = button?.reply?.title ?? "Option";

            const edge = makeButtonEdge(missing.nodeId, primaryResolveId, missing.missingBranch, title);
            edges.push(edge);
            repairsApplied.push(
                `Added missing edge for AskButton button "${title}" on node "${missing.nodeId}" → "${primaryResolveId}".`
            );
        }
    }

    // ── R6: Fix Orphan nodes ──────────────────────────────────────────────────
    if (checkResult.summary.orphanNodeIds.length > 0) {
        // Find a reasonable entry point (node connected from trigger "1")
        const triggerEdge = edges.find((e) => e.source === "1");
        const entryPointId = triggerEdge?.target || primaryResolveId;

        for (const orphanId of checkResult.summary.orphanNodeIds) {
            // Check if it's already fixed (e.g. by being target of another fix)
            const hasIncoming = edges.some((e) => e.target === orphanId);
            if (hasIncoming) continue;

            const edge = makeSimpleEdge(entryPointId, orphanId);
            edges.push(edge);
            repairsApplied.push(
                `Connected orphan node "${orphanId}" from entry point "${entryPointId}".`
            );
        }
    }

    return {
        repaired: { ...data, nodes, edges },
        repairsApplied,
        repairsFailed,
    };
}
