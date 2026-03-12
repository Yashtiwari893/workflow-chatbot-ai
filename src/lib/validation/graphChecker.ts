/**
 * lib/validation/graphChecker.ts
 *
 * Full 11za graph integrity & branch completeness validator.
 *
 * This module implements the complete set of checks required to ensure
 * a generated workflow is engine-ready for the 11za platform:
 *
 * CHECK 1: Trigger node "1" exists
 * CHECK 2: At least one ResolveConversation node exists
 * CHECK 3: Every ApiRequest has both success + fail outgoing edges
 * CHECK 4: Every Condition has both true + false outgoing edges
 * CHECK 5: Every AskButton has one edge per button payload
 * CHECK 6: No dead-end nodes (no outgoing edges except ResolveConversation)
 * CHECK 7: No orphan nodes (not reachable from trigger "1")
 * CHECK 8: All node IDs are unique
 * CHECK 9: All edge IDs are unique
 */

import type { WorkflowData, ElevenZaNode } from "./workflow";

export interface GraphCheckResult {
    valid: boolean;
    errors: GraphCheckError[];
    warnings: string[];
    summary: {
        totalNodes: number;
        totalEdges: number;
        resolveConversationCount: number;
        apiRequestCount: number;
        conditionCount: number;
        askButtonCount: number;
        orphanNodeIds: string[];
        deadEndNodeIds: string[];
        missingBranches: MissingBranchInfo[];
    };
}

export interface GraphCheckError {
    code: string;
    message: string;
    nodeId?: string;
}

export interface MissingBranchInfo {
    nodeId: string;
    tag: string;
    missingBranch: "success" | "fail" | string; // button payload if missing button edge
}

// ─── Helper: get the tag of a node safely ────────────────────────────────────

function getTag(node: ElevenZaNode): string | null {
    const d = node.data;
    if ("tag" in d) return d.tag;
    return null; // trigger node has no tag
}

// ─── Helper: get button payloads from an AskButton node ──────────────────────

function getButtonPayloads(node: ElevenZaNode): string[] {
    const d = node.data;
    if (!("tag" in d) || d.tag !== "AskButton") return [];
    try {
        const buttons = d.selectInteractive?.content?.interactive?.components?.buttons ?? [];
        return buttons.map((b: any) => b.reply?.payload).filter(Boolean);
    } catch {
        return [];
    }
}

// ─── Main Graph Check Function ────────────────────────────────────────────────

export function runFullGraphCheck(data: WorkflowData): GraphCheckResult {
    const errors: GraphCheckError[] = [];
    const warnings: string[] = [];
    const missingBranches: MissingBranchInfo[] = [];

    const nodeIds = data.nodes.map((n) => n.id);
    const nodeMap = new Map<string, ElevenZaNode>(data.nodes.map((n) => [n.id, n]));

    // Build adjacency: outgoing edges per source node
    const outgoingEdgesMap = new Map<string, typeof data.edges>();
    for (const node of data.nodes) {
        outgoingEdgesMap.set(node.id, []);
    }
    for (const edge of data.edges) {
        const list = outgoingEdgesMap.get(edge.source);
        if (list) list.push(edge);
    }

    // Build adjacency: incoming edges per target node
    const incomingEdgesMap = new Map<string, typeof data.edges>();
    for (const node of data.nodes) {
        incomingEdgesMap.set(node.id, []);
    }
    for (const edge of data.edges) {
        const list = incomingEdgesMap.get(edge.target);
        if (list) list.push(edge);
    }

    // ── CHECK 1: Trigger node "1" must exist ─────────────────────────────────
    if (!nodeMap.has("1")) {
        errors.push({
            code: "MISSING_TRIGGER",
            message: "Trigger node with id=\"1\" is missing.",
        });
    }

    // ── CHECK 2: At least one ResolveConversation node must exist ────────────
    const resolveNodes = data.nodes.filter((n) => getTag(n) === "ResolveConversation");
    if (resolveNodes.length === 0) {
        errors.push({
            code: "MISSING_RESOLVE",
            message:
                "No ResolveConversation node found. Every 11za flow MUST terminate in ResolveConversation.",
        });
    }

    // ── CHECK 3 & 4: ApiRequest and Condition must have success + fail edges ──
    for (const node of data.nodes) {
        const tag = getTag(node);
        if (tag !== "ApiRequest" && tag !== "Condition") continue;

        const outEdges = outgoingEdgesMap.get(node.id) ?? [];
        const sourceHandles = outEdges.map((e) => e.sourceHandle ?? "");

        const hasSuccess = sourceHandles.some(
            (h) => h === "success::true" || (outEdges.find((e) => e.sourceHandle === h)?.data?.buttonId === "success")
        );
        const hasFail = sourceHandles.some(
            (h) => h === "fail::false" || (outEdges.find((e) => e.sourceHandle === h)?.data?.buttonId === "fail")
        );

        if (!hasSuccess) {
            errors.push({
                code: "MISSING_SUCCESS_EDGE",
                message: `${tag} node "${node.id}" is missing a success edge (sourceHandle: "success::true").`,
                nodeId: node.id,
            });
            missingBranches.push({ nodeId: node.id, tag, missingBranch: "success" });
        }

        if (!hasFail) {
            errors.push({
                code: "MISSING_FAIL_EDGE",
                message: `${tag} node "${node.id}" is missing a fail edge (sourceHandle: "fail::false").`,
                nodeId: node.id,
            });
            missingBranches.push({ nodeId: node.id, tag, missingBranch: "fail" });
        }
    }

    // ── CHECK 5: AskButton — every button payload must have a corresponding edge ──
    for (const node of data.nodes) {
        if (getTag(node) !== "AskButton") continue;

        const payloads = getButtonPayloads(node);
        const outEdges = outgoingEdgesMap.get(node.id) ?? [];
        const edgeButtonIds = new Set(outEdges.map((e) => e.data?.buttonId ?? ""));

        for (const payload of payloads) {
            if (!edgeButtonIds.has(payload)) {
                errors.push({
                    code: "MISSING_BUTTON_EDGE",
                    message: `AskButton node "${node.id}" has button with payload "${payload}" but no corresponding outgoing edge.`,
                    nodeId: node.id,
                });
                missingBranches.push({ nodeId: node.id, tag: "AskButton", missingBranch: payload });
            }
        }

        if (payloads.length === 0) {
            warnings.push(`AskButton node "${node.id}" has no buttons defined.`);
        }
    }

    // ── CHECK 6: No dead-end nodes (except ResolveConversation) ──────────────
    const deadEndNodeIds: string[] = [];
    for (const node of data.nodes) {
        const tag = getTag(node);
        if (tag === "ResolveConversation") continue; // terminal by design
        if (node.id === "1") continue; // trigger without outgoing edges is checked separately

        const outEdges = outgoingEdgesMap.get(node.id) ?? [];
        if (outEdges.length === 0) {
            deadEndNodeIds.push(node.id);
            errors.push({
                code: "DEAD_END_NODE",
                message: `Node "${node.id}" (tag: ${tag ?? "trigger"}) has no outgoing edges and is not a ResolveConversation node.`,
                nodeId: node.id,
            });
        }
    }

    // ── CHECK 7: No orphan nodes (not reachable from trigger "1") ────────────
    const orphanNodeIds: string[] = [];
    if (nodeMap.has("1")) {
        // BFS from trigger "1"
        const visited = new Set<string>();
        const queue = ["1"];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);
            const outEdges = outgoingEdgesMap.get(current) ?? [];
            for (const edge of outEdges) {
                if (!visited.has(edge.target)) {
                    queue.push(edge.target);
                }
            }
        }

        for (const nodeId of nodeIds) {
            if (!visited.has(nodeId)) {
                orphanNodeIds.push(nodeId);
                errors.push({
                    code: "ORPHAN_NODE",
                    message: `Node "${nodeId}" (tag: ${getTag(nodeMap.get(nodeId)!) ?? "unknown"}) is not reachable from the trigger node "1".`,
                    nodeId,
                });
            }
        }
    }

    // ── CHECK 8: Unique node IDs ──────────────────────────────────────────────
    const seenNodeIds = new Set<string>();
    for (const id of nodeIds) {
        if (seenNodeIds.has(id)) {
            errors.push({
                code: "DUPLICATE_NODE_ID",
                message: `Duplicate node ID detected: "${id}".`,
                nodeId: id,
            });
        }
        seenNodeIds.add(id);
    }

    // ── CHECK 9: Unique edge IDs ──────────────────────────────────────────────
    const seenEdgeIds = new Set<string>();
    for (const edge of data.edges) {
        if (seenEdgeIds.has(edge.id)) {
            errors.push({
                code: "DUPLICATE_EDGE_ID",
                message: `Duplicate edge ID detected: "${edge.id}".`,
            });
        }
        seenEdgeIds.add(edge.id);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
            totalNodes: data.nodes.length,
            totalEdges: data.edges.length,
            resolveConversationCount: resolveNodes.length,
            apiRequestCount: data.nodes.filter((n) => getTag(n) === "ApiRequest").length,
            conditionCount: data.nodes.filter((n) => getTag(n) === "Condition").length,
            askButtonCount: data.nodes.filter((n) => getTag(n) === "AskButton").length,
            orphanNodeIds,
            deadEndNodeIds,
            missingBranches,
        },
    };
}
