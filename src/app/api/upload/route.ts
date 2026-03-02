import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { analyzeWorkflow, workflowSchema } from "@/lib/validation/workflow";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch {
            return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
        }

        // Validate structure
        const parseResult = workflowSchema.safeParse(json);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid workflow format", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const stats = analyzeWorkflow(parseResult.data);

        // Save to Supabase Storage (Mocking here, real one requires proper anon key & RLS)
        const filePath = `workflows/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("workflow_files")
            .upload(filePath, file);

        if (uploadError) {
            console.error("Storage error:", uploadError);
            // We can still continue recording metadata if we want, or fail here
        }

        // Save metadata to Supabase DB
        const { data: dbData, error: dbError } = await supabase
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
            console.warn("DB error (Supabase might not be configured yet):", dbError.message);
            // Fallback mock success for local testing before user sets up Supabase
            return NextResponse.json({
                success: true,
                file: { file_name: file.name, node_count: stats.nodeCount, api_block_count: stats.apiBlockCount },
                stats,
                warning: "Supabase not configured, file not saved to DB."
            });
        }

        // Note: Generating embeddings via an async worker or here sequentially

        return NextResponse.json({ success: true, file: dbData, stats });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
