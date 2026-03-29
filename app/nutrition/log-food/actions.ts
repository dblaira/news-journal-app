"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function searchFoods(query: string) {
    const supabase = await createClient();

    if (!query) return [];

    const { data } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${query}%`)
        .limit(10);

    return data || [];
}

export async function logFood(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const foodId = formData.get("foodId") as string;
    const mealName = formData.get("mealName") as string; // "Breakfast", "Lunch", etc.
    const quantity = parseFloat(formData.get("quantity") as string) || 1;

    // 1. Get or Create the Meal slot for today
    const today = new Date().toISOString().split("T")[0];

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
            .insert({
                user_id: user.id,
                date: today,
                name: mealName,
            })
            .select("id")
            .single();

        if (error) throw new Error("Failed to create meal slot");
        meal = newMeal;
    }

    // 2. Add the Entry
    const { error: entryError } = await supabase
        .from("meal_entries")
        .insert({
            meal_id: meal.id,
            food_id: foodId,
            quantity: quantity,
        });

    if (entryError) throw new Error("Failed to log food");

    revalidatePath("/");
    redirect("/");
}
