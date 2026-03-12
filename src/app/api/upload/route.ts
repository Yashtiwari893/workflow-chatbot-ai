import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";
import { analyzeWorkflow, workflowSchema } from "@/lib/validation/workflow";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("[Upload API] No file found in FormData");
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e: any) {
            console.error("[Upload API] JSON parse failed:", e.message);
            return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
        }

        // Validate structure
        const parseResult = workflowSchema.safeParse(json);
        if (!parseResult.success) {
            console.error("[Upload API] Schema validation failed:", JSON.stringify(parseResult.error.format(), null, 2));
            return NextResponse.json(
                { error: "Invalid workflow format", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const stats = analyzeWorkflow(parseResult.data);

        // Create a fallback response helper
        const fallbackResponse = () => NextResponse.json({
            success: true,
            file: { file_name: file.name, node_count: stats.nodeCount, api_block_count: stats.apiBlockCount },
            stats,
            warning: "Supabase connection failed (Check URL/Network). Data not saved in DB."
        });

        const filePath = `workflows/${Date.now()}-${file.name}`;

        try {
            // Priority 1: Upload to Storage
            const { error: uploadError } = await supabaseAdmin.storage
                .from("workflow_files")
                .upload(filePath, file);

            if (uploadError) console.warn("Supabase Storage Error:", uploadError.message);

            // Priority 2: Insert into DB
            const { data: dbData, error: dbError } = await supabaseAdmin
                .from("workflow_samples")
                .insert([
                    {
                        file_name: file.name,
                        storage_path: filePath,
                        node_count: stats.nodeCount,
                        api_block_count: stats.apiBlockCount,
                        condition_block_count: stats.conditionBlockCount,
                        raw_json: json,
                    }
                ])
                .select()
                .single();

            if (dbError) {
                console.warn("Supabase DB Error:", dbError.message);
                return fallbackResponse();
            }

            return NextResponse.json({ success: true, file: dbData, stats });

        } catch (supabaseErr: any) {
            console.error("Supabase Connection Exception:", supabaseErr.message);
            return fallbackResponse();
        }

        // Note: Generating embeddings via an async worker or here sequentially
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
