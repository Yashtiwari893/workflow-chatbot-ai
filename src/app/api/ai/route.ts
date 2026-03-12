/**
 * app/api/ai/route.ts
 *
 * Main AI pipeline endpoint for 11za workflow generation.
 *
 * PIPELINE:
 * Phase 1: Groq (llama3-8b-8192) — Fast intent extraction & outline
 * Phase 2: Mistral (mistral-large-latest) — Full 11za JSON generation
 * Phase 3: JSON.parse() with safety catch
 * Phase 4: Zod schema validation (BLOCKING — returns 422 on failure)
 * Phase 5: Full graph integrity check (runFullGraphCheck)
 * Phase 6: Auto-repair (autoRepairFlow) — fixes common structural issues
 *
 * IMPROVEMENTS over original:
 * - Uses singleton AI clients (no per-request instantiation)
 * - Zod failure is now a HARD BLOCK (returns 422 with schema errors)
 * - Full graph check (branch completeness, orphans, dead-ends)
 * - Auto-repair wired in after graph check
 * - Removed all `as any` and `@ts-ignore`
 * - All error paths return structured JSON responses
 * - Richer metadata in success response
 */

import { NextRequest, NextResponse } from "next/server";
import { groqClient, mistralClient } from "@/lib/ai/clients";
import { GROQ_ROUTING_PROMPT, MISTRAL_JSON_PROMPT } from "@/lib/ai/prompts";
import { workflowSchema, validateGraphIntegrity } from "@/lib/validation/workflow";
import { runFullGraphCheck } from "@/lib/validation/graphChecker";
import { autoRepairFlow } from "@/lib/flow/repair";

export async function POST(req: NextRequest) {
    try {
        // ── Input Validation ───────────────────────────────────────────────────
        let prompt: string;
        try {
            const body = await req.json();
            prompt = body?.prompt;
        } catch {
            return NextResponse.json(
                { error: "Invalid request body. Expected JSON with a 'prompt' field." },
                { status: 400 }
            );
        }

        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "No prompt provided. Please describe the workflow you want to create." },
                { status: 400 }
            );
        }

        // ── Phase 1: Groq — Fast Intent & Outline Extraction ──────────────────
        let outline = "";
        try {
            const groqRes = await groqClient.chat.completions.create({
                messages: [
                    { role: "system", content: GROQ_ROUTING_PROMPT },
                    { role: "user", content: prompt.trim() },
                ],
                // llama3-8b-8192 was decommissioned — llama-3.3-70b-versatile is the official replacement
                model: "llama-3.1-8b-instant",
                max_tokens: 700,
                temperature: 0.3,
            });
            outline = groqRes.choices[0]?.message?.content ?? "";
        } catch (e) {
            // Groq failure is non-fatal: fall back to using raw prompt as the outline.
            // Mistral can still generate a valid flow from the raw requirement.
            console.error("[Phase 1] Groq outline extraction failed:", e);
            outline = prompt.trim();
        }

        // ── Phase 2: Groq — UI JSON Generation (Speed Optimized) ────────────
        let jsonGen = "";
        try {
            const groqRes = await groqClient.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: MISTRAL_JSON_PROMPT.replace("{{CURRENT_TIMESTAMP}}", Date.now().toString()) 
                    },
                    {
                        role: "user",
                        content: [
                            "User Requirement:",
                            prompt.trim(),
                            "",
                            "Flow Outline:",
                            outline,
                            "",
                            "Generate the complete, valid 11za workflow JSON now.",
                            "Remember: Every API/Condition MUST have success+fail edges. Flow MUST end with ResolveConversation.",
                        ].join("\n"),
                    },
                ],
                // Use JSON mode for reliable parsing
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            jsonGen = groqRes.choices[0]?.message?.content ?? "";
        } catch (e) {
            console.error("[Phase 2] Groq JSON generation failed:", e);
            return NextResponse.json(
                {
                    error:
                        "AI JSON generation failed due to a provider timeout or capacity issue. Please try again in a few seconds.",
                },
                { status: 500 }
            );
        }

        // ── Phase 3: Safe JSON Parse ───────────────────────────────────────────
        let parsedData: unknown;
        try {
            parsedData = JSON.parse(jsonGen);
        } catch {
            console.error("[Phase 3] Mistral returned invalid JSON:", jsonGen.slice(0, 500));
            return NextResponse.json(
                {
                    error:
                        "AI returned invalid JSON. Try rephrasing your requirement more specifically. If the problem persists, try a simpler flow first.",
                },
                { status: 500 }
            );
        }

        // ── Phase 4: Zod Schema Validation (HARD BLOCK) ───────────────────────
        const schemaResult = workflowSchema.safeParse(parsedData);
        if (!schemaResult.success) {
            const schemaErrors = schemaResult.error.flatten();
            console.error("[Phase 4] Schema validation failed:", JSON.stringify(schemaErrors, null, 2));
            return NextResponse.json(
                {
                    error:
                        "The AI generated a workflow that does not match the 11za schema. Please try rephrasing your requirement.",
                    details: schemaErrors,
                },
                { status: 422 }
            );
        }

        const validatedData = schemaResult.data;

        // ── Phase 4b: Basic Dangling Edge Removal ─────────────────────────────
        const { errors: integrityErrors, fixed: basicFixed } = validateGraphIntegrity(validatedData);
        if (integrityErrors.length > 0) {
            console.warn("[Phase 4b] Dangling edges removed:", integrityErrors);
        }

        // ── Phase 5: Full Graph Integrity Check ───────────────────────────────
        const graphCheckResult = runFullGraphCheck(basicFixed);

        // ── Phase 6: Auto-Repair ──────────────────────────────────────────────
        const { repaired, repairsApplied, repairsFailed } = autoRepairFlow(basicFixed, graphCheckResult);

        // Run graph check once more on the repaired output to get final status
        const finalCheckResult = runFullGraphCheck(repaired);

        // ── Response ──────────────────────────────────────────────────────────
        return NextResponse.json({
            success: true,
            data: repaired,
            metadata: {
                outline,
                schemaValid: true,
                graphValid: finalCheckResult.valid,
                summary: finalCheckResult.summary,
                graphErrors: finalCheckResult.errors,
                graphWarnings: finalCheckResult.warnings,
                repairsApplied,
                repairsFailed,
                // Legacy fields for backward-compat with ChatWindow.tsx
                nodeCount: repaired.nodes?.length ?? 0,
                edgeCount: repaired.edges?.length ?? 0,
                autoFixedErrors: [
                    ...integrityErrors,
                    ...repairsApplied,
                ],
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("[API /api/ai] Unhandled error:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
