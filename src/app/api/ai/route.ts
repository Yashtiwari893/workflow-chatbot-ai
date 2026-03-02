import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { Groq } from "groq-sdk";
import { GROQ_ROUTING_PROMPT, MISTRAL_JSON_PROMPT } from "@/lib/ai/prompts";
import { workflowSchema, validateGraphIntegrity } from "@/lib/validation/workflow";

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy" });
        const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "dummy" });

        // ── Phase 1: Groq — Fast Intent & Outline Extraction ──────────────────────
        let outline = "";
        try {
            const groqRes = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: GROQ_ROUTING_PROMPT },
                    { role: "user", content: prompt },
                ],
                model: "llama3-8b-8192",
                max_tokens: 500,
            });
            outline = groqRes.choices[0]?.message?.content || "";
        } catch (e) {
            console.error("Groq Outline Extraction Failed:", e);
            outline = prompt;
        }

        // ── Phase 2: Mistral — JSON Generation in 11za format ─────────────────────
        let jsonGen = "";
        try {
            const mistralRes = await mistral.chat.complete({
                model: "mistral-large-latest",
                messages: [
                    { role: "system", content: MISTRAL_JSON_PROMPT },
                    {
                        role: "user",
                        content: `User Requirement:\n${prompt}\n\nFlow Outline:\n${outline}\n\nGenerate the complete 11za workflow JSON now.`,
                    },
                ] as any,
                responseFormat: { type: "json_object" },
                temperature: 0.2,
            });
            // @ts-ignore
            jsonGen = mistralRes.choices[0]?.message?.content || "";
        } catch (e) {
            console.error("Mistral JSON Generation Failed:", e);
            return NextResponse.json({ error: "AI JSON Generation Failed. Check your MISTRAL_API_KEY." }, { status: 500 });
        }

        // ── Phase 3: Parse ─────────────────────────────────────────────────────────
        let parsedData;
        try {
            parsedData = JSON.parse(jsonGen);
        } catch {
            return NextResponse.json({ error: "AI returned invalid JSON. Try rephrasing your request." }, { status: 500 });
        }

        // ── Phase 4: Zod Schema Validation ────────────────────────────────────────
        const parseResult = workflowSchema.safeParse(parsedData);
        if (!parseResult.success) {
            console.warn("Schema validation issues:", parseResult.error.flatten());
            // Still return the data, just flag it
        }

        // ── Phase 5: Graph Integrity Check + Auto-fix ─────────────────────────────
        const { valid, errors, fixed } = validateGraphIntegrity(parsedData);

        return NextResponse.json({
            success: true,
            data: fixed,
            metadata: {
                outline,
                schemaValid: parseResult.success,
                graphValid: valid,
                autoFixedErrors: errors,
                nodeCount: fixed.nodes?.length || 0,
                edgeCount: fixed.edges?.length || 0,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
