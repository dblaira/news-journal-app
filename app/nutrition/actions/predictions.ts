"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface PredictedItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PredictedMeal {
  meal_name: string;
  items: PredictedItem[];
}

export async function acceptPrediction(date: string, meal: PredictedMeal) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let { data: existingMeal } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("name", meal.meal_name)
    .single();

  if (!existingMeal) {
    const { data: newMeal, error } = await supabase
      .from("meals")
      .insert({ user_id: user.id, date, name: meal.meal_name })
      .select("id")
      .single();
    if (error) return { error: error.message };
    existingMeal = newMeal;
  }

  for (const item of meal.items) {
    const { data: food } = await supabase
      .from("foods")
      .select("id")
      .ilike("name", item.name)
      .limit(1)
      .single();

    let foodId: string;
    if (food) {
      foodId = food.id;
    } else {
      const { data: newFood, error } = await supabase
        .from("foods")
        .insert({
          created_by: user.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          serving_size: `${item.quantity} ${item.unit}`,
          external_source: "prediction",
        })
        .select("id")
        .single();
      if (error) continue;
      foodId = newFood!.id;
    }

    await supabase.from("meal_entries").insert({
      meal_id: existingMeal!.id,
      food_id: foodId,
      quantity: item.quantity,
      external_source: "prediction",
    });
  }

  revalidatePath("/");
  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function dismissPrediction(date: string, mealName: string) {
  return { success: true };
}
