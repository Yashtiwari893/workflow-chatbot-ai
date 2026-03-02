import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { Groq } from "groq-sdk";
import { GROQ_ROUTING_PROMPT, MISTRAL_JSON_PROMPT } from "@/lib/ai/prompts";
import { workflowSchema } from "@/lib/validation/workflow";

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        // Initialize clients
        // In production, keys should be protected via process.env
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy" });
        const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "dummy" });

        // Phase 1: Structuring intent with fast Groq model
        let outline = "";
        try {
            const groqRes = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: GROQ_ROUTING_PROMPT },
                    { role: "user", content: prompt },
                ],
                model: "llama3-8b-8192", // Use a very fast model
            });
            outline = groqRes.choices[0]?.message?.content || "";
        } catch (e) {
            console.error("Groq Intent Extraction Failed:", e);
            outline = prompt; // fallback to raw prompt
        }

        // Phase 2: Generating robust JSON with Mistral
        const mistralMessages = [
            { role: "system", content: MISTRAL_JSON_PROMPT },
            { role: "user", content: `Requirement: ${prompt}\n\nOutline: ${outline}` },
        ];

        let jsonGen = "";
        try {
            const mistralRes = await mistral.chat.complete({
                model: "mistral-large-latest",
                messages: mistralMessages as any,
                responseFormat: { type: "json_object" }, // Mistral supports JSON mode
            });
            // @ts-ignore
            jsonGen = mistralRes.choices[0]?.message?.content || "";
        } catch (e) {
            console.error("Mistral JSON Generation Failed:", e);
            return NextResponse.json({ error: "AI Generation Failed" }, { status: 500 });
        }

        // Phase 3: Validation checks
        let parsedData;
        let isValid = false;
        let autoFixed = false;
        try {
            parsedData = JSON.parse(jsonGen);
            const parseResult = workflowSchema.safeParse(parsedData);
            isValid = parseResult.success;

            // Basic Auto-fix: Remove dangling edges
            if (isValid) {
                const nodeIds = new Set(parsedData.nodes.map((n: any) => n.id));
                const validEdges = parsedData.edges.filter(
                    (e: any) => nodeIds.has(e.source) && nodeIds.has(e.target)
                );
                if (validEdges.length < parsedData.edges.length) {
                    parsedData.edges = validEdges;
                    autoFixed = true;
                }
            }
        } catch {
            return NextResponse.json({ error: "Generated content is not valid JSON" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
            metadata: {
                outline,
                isValid,
                autoFixed
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
