import { createClient } from "@supabase/supabase-js"

// Public client for browser-side (limited permissions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side API routes ONLY (bypasses RLS)
// NEVER expose this in browser or client components
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})
