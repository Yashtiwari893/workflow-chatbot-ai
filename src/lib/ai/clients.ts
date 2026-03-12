/**
 * lib/ai/clients.ts
 *
 * Singleton AI client instances.
 * Instantiating these at module level (not per-request) avoids connection pool
 * exhaustion and ensures proper connection reuse under concurrent request load.
 *
 * IMPORTANT: This module is server-side only. Never import in client components.
 */

import { Groq } from "groq-sdk";
import { Mistral } from "@mistralai/mistralai";

// ── Groq Client ───────────────────────────────────────────────────────────────
// Used for: Fast intent extraction / outline generation (Phase 1)
export const groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy-groq-key",
});

// ── Mistral Client ────────────────────────────────────────────────────────────
// Used for: Full 11za JSON workflow generation (Phase 2)
export const mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || "dummy-mistral-key",
});
