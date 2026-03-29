import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError } from "@/lib/nutrition/server-logger";

export async function GET() {
    return NextResponse.json({ status: "online", message: "Activity Sync API is ready" });
}

export async function POST(request: NextRequest) {
    // 1. Security Check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.ACTIVITY_API_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, active_calories, steps } = body;

        if (!email || active_calories === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 2. Find User ID
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Upsert Activity
        const today = new Date().toISOString().split("T")[0];

        const { error: upsertError } = await supabase
            .from("daily_activity")
            .upsert({
                user_id: profile.id,
                date: today,
                active_calories: active_calories,
                steps: steps || 0,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,date" });

        if (upsertError) {
            logServerError("webhook/activity", "Failed to update activity", {
                supabaseError: upsertError.message,
            }, profile.id);
            return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        logServerError("webhook/activity", e.message || "Internal server error", {
            stack: e.stack,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
