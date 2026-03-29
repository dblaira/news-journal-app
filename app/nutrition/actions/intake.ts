"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function saveIntake(input: SaveIntakeInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const source = input.external_source || "ai_parsed";
  const today = new Date().toISOString().split("T")[0];
  const errors: string[] = [];

  // Handle food items
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
        // Create or find the food in the database
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

        // Auto-log caffeine if present
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

  // Handle water
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

  // Handle caffeine (standalone, not from food)
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

  // Handle supplements
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
        // Decrement stock
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

  revalidatePath("/");

  if (errors.length > 0) {
    return { error: errors.join("; "), partial: true };
  }

  return { success: true };
}

export async function logWater(amountOz: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("water_logs").insert({
    user_id: user.id,
    amount_oz: amountOz,
    external_source: "manual",
  });

  revalidatePath("/");
  return error ? { error: error.message } : { success: true };
}

export async function logCaffeine(source: string, amountMg: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("caffeine_logs").insert({
    user_id: user.id,
    source,
    amount_mg: amountMg,
    external_source: "manual",
  });

  revalidatePath("/");
  return error ? { error: error.message } : { success: true };
}

export async function logSupplementStack(timeOfDay: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: supplements } = await supabase
    .from("supplements")
    .select("id, current_stock")
    .eq("user_id", user.id)
    .eq("time_of_day", timeOfDay);

  if (!supplements || supplements.length === 0) {
    return { error: `No supplements configured for ${timeOfDay}` };
  }

  for (const sup of supplements) {
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
  }

  revalidatePath("/");
  return { success: true, count: supplements.length };
}

export async function getTodayWaterTotal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("water_logs")
    .select("amount_oz")
    .eq("user_id", user.id)
    .gte("logged_at", `${today}T00:00:00`)
    .lte("logged_at", `${today}T23:59:59`);

  return (data || []).reduce((sum: number, row: any) => sum + Number(row.amount_oz), 0);
}

export async function getTodayCaffeineTotal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("caffeine_logs")
    .select("amount_mg")
    .eq("user_id", user.id)
    .gte("logged_at", `${today}T00:00:00`)
    .lte("logged_at", `${today}T23:59:59`);

  return (data || []).reduce((sum: number, row: any) => sum + Number(row.amount_mg), 0);
}
