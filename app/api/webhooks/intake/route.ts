import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError } from "@/lib/nutrition/server-logger";

export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "Intake webhook is ready",
    accepts: ["water", "caffeine", "supplement"],
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ACTIVITY_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email || !type) {
      return NextResponse.json(
        { error: "Missing required fields: email, type" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = profile.id;
    const source = body.source_app || "shortcut";

    switch (type) {
      case "water": {
        const amountOz = body.amount_oz;
        if (!amountOz || amountOz <= 0) {
          return NextResponse.json({ error: "amount_oz is required and must be > 0" }, { status: 400 });
        }
        const { error } = await supabase.from("water_logs").insert({
          user_id: userId,
          amount_oz: amountOz,
          external_source: source,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, logged: { type: "water", amount_oz: amountOz } });
      }

      case "caffeine": {
        const amountMg = body.amount_mg;
        const caffeineSource = body.caffeine_source || "unknown";
        if (!amountMg || amountMg <= 0) {
          return NextResponse.json({ error: "amount_mg is required and must be > 0" }, { status: 400 });
        }
        const { error } = await supabase.from("caffeine_logs").insert({
          user_id: userId,
          source: caffeineSource,
          amount_mg: amountMg,
          external_source: source,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, logged: { type: "caffeine", source: caffeineSource, amount_mg: amountMg } });
      }

      case "supplement": {
        const timeOfDay = body.time_of_day || "morning";
        const { data: supplements } = await supabase
          .from("supplements")
          .select("id, name, current_stock")
          .eq("user_id", userId)
          .eq("time_of_day", timeOfDay);

        if (!supplements || supplements.length === 0) {
          return NextResponse.json(
            { error: `No supplements configured for ${timeOfDay}` },
            { status: 404 }
          );
        }

        const logged: string[] = [];
        for (const sup of supplements) {
          await supabase.from("supplement_logs").insert({
            user_id: userId,
            supplement_id: sup.id,
          });
          if (sup.current_stock && sup.current_stock > 0) {
            await supabase
              .from("supplements")
              .update({ current_stock: sup.current_stock - 1 })
              .eq("id", sup.id);
          }
          logged.push(sup.name);
        }

        return NextResponse.json({ success: true, logged: { type: "supplement", supplements: logged } });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Use water, caffeine, or supplement.` },
          { status: 400 }
        );
    }
  } catch (e: any) {
    logServerError("webhook/intake", e.message || "Internal server error", {
      stack: e.stack,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
