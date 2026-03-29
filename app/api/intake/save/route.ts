import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/from-request";
import { logServerError } from "@/lib/nutrition/server-logger";

interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  caffeine_mg: number;
}

interface SaveIntakeInput {
  type: "food" | "water" | "caffeine" | "supplement" | "multi";
  meal_name?: string | null;
  items?: FoodItem[];
  water_oz?: number | null;
  caffeine_source?: string | null;
  caffeine_mg?: number | null;
  supplements?: string[] | null;
  external_source?: string;
}

export async function POST(request: NextRequest) {
  const { user, supabase } = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input: SaveIntakeInput = await request.json();

    if (!input.type) {
      return NextResponse.json(
        { error: "type is required (food, water, caffeine, supplement, multi)" },
        { status: 400 }
      );
    }

    const source = input.external_source || "ios_app";
    const today = new Date().toISOString().split("T")[0];
    const errors: string[] = [];

    if (
      (input.type === "food" || input.type === "multi") &&
      input.items &&
      input.items.length > 0
    ) {
      const mealName = input.meal_name || "Snack";

      let { data: meal } = await supabase
        .from("meals")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("name", mealName)
        .single();

      if (!meal) {
        const { data: newMeal, error } = await supabase
          .from("meals")
          .insert({ user_id: user.id, date: today, name: mealName })
          .select("id")
          .single();
        if (error) {
          errors.push(`Failed to create meal: ${error.message}`);
        } else {
          meal = newMeal;
        }
      }

      if (meal) {
        for (const item of input.items) {
          const { data: existingFood } = await supabase
            .from("foods")
            .select("id")
            .ilike("name", item.name)
            .limit(1)
            .single();

          let foodId: string;

          if (existingFood) {
            foodId = existingFood.id;
          } else {
            const { data: newFood, error: foodErr } = await supabase
              .from("foods")
              .insert({
                created_by: user.id,
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                caffeine_mg: item.caffeine_mg || 0,
                serving_size: `${item.quantity} ${item.unit}`,
                external_source: source,
              })
              .select("id")
              .single();

            if (foodErr || !newFood) {
              errors.push(`Failed to create food "${item.name}": ${foodErr?.message}`);
              continue;
            }
            foodId = newFood.id;
          }

          const { error: entryErr } = await supabase.from("meal_entries").insert({
            meal_id: meal.id,
            food_id: foodId,
            quantity: item.quantity,
            external_source: source,
          });

          if (entryErr) {
            errors.push(`Failed to log "${item.name}": ${entryErr.message}`);
          }

          if (item.caffeine_mg > 0) {
            await supabase.from("caffeine_logs").insert({
              user_id: user.id,
              source: item.name,
              amount_mg: item.caffeine_mg * item.quantity,
              external_source: source,
            });
          }
        }
      }
    }

    if (
      (input.type === "water" || input.type === "multi") &&
      input.water_oz &&
      input.water_oz > 0
    ) {
      const { error } = await supabase.from("water_logs").insert({
        user_id: user.id,
        amount_oz: input.water_oz,
        external_source: source,
      });
      if (error) errors.push(`Failed to log water: ${error.message}`);
    }

    if (
      (input.type === "caffeine" || input.type === "multi") &&
      input.caffeine_mg &&
      input.caffeine_mg > 0
    ) {
      const { error } = await supabase.from("caffeine_logs").insert({
        user_id: user.id,
        source: input.caffeine_source || "unknown",
        amount_mg: input.caffeine_mg,
        external_source: source,
      });
      if (error) errors.push(`Failed to log caffeine: ${error.message}`);
    }

    if (
      (input.type === "supplement" || input.type === "multi") &&
      input.supplements &&
      input.supplements.length > 0
    ) {
      for (const supName of input.supplements) {
        const { data: sup } = await supabase
          .from("supplements")
          .select("id, current_stock")
          .eq("user_id", user.id)
          .ilike("name", `%${supName}%`)
          .limit(1)
          .single();

        if (sup) {
          await supabase.from("supplement_logs").insert({
            user_id: user.id,
            supplement_id: sup.id,
          });
          if (sup.current_stock && sup.current_stock > 0) {
            await supabase
              .from("supplements")
              .update({ current_stock: sup.current_stock - 1 })
              .eq("id", sup.id);
          }
        } else {
          errors.push(`Supplement "${supName}" not found in your stack`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; "), partial: true }, { status: 207 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logServerError("api/intake/save", e.message || "Internal server error", {
      stack: e.stack,
    }, user.id);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
