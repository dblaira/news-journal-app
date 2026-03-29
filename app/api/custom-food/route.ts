import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, brand, serving_size, calories, protein, carbs, fat, caffeine_mg } = body;

    if (!name || calories === undefined) {
      return NextResponse.json({ error: "Name and calories are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("foods")
      .insert({
        created_by: user.id,
        name,
        brand: brand || null,
        serving_size: serving_size || "1 serving",
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        caffeine_mg: Number(caffeine_mg) || 0,
        external_source: "manual",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
