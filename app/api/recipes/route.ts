import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface IngredientInput {
  food_id: string;
  quantity: number;
}

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
    const { name, serving_size, ingredients } = body as {
      name: string;
      serving_size: string;
      ingredients: IngredientInput[];
    };

    if (!name || !ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Name and at least one ingredient are required" },
        { status: 400 }
      );
    }

    // Look up all ingredient foods to compute aggregate macros
    const foodIds = ingredients.map((i) => i.food_id);
    const { data: foods } = await supabase
      .from("foods")
      .select("id, calories, protein, carbs, fat, caffeine_mg")
      .in("id", foodIds);

    if (!foods) {
      return NextResponse.json({ error: "Failed to look up ingredients" }, { status: 500 });
    }

    const foodMap = new Map(foods.map((f) => [f.id, f]));
    let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, totalCaff = 0;

    for (const ing of ingredients) {
      const food = foodMap.get(ing.food_id);
      if (!food) continue;
      totalCal += food.calories * ing.quantity;
      totalP += Number(food.protein) * ing.quantity;
      totalC += Number(food.carbs) * ing.quantity;
      totalF += Number(food.fat) * ing.quantity;
      totalCaff += Number(food.caffeine_mg || 0) * ing.quantity;
    }

    // Create the recipe as a food entry with is_recipe = true
    const { data: recipe, error: recipeErr } = await supabase
      .from("foods")
      .insert({
        created_by: user.id,
        name,
        calories: Math.round(totalCal),
        protein: Math.round(totalP * 10) / 10,
        carbs: Math.round(totalC * 10) / 10,
        fat: Math.round(totalF * 10) / 10,
        caffeine_mg: Math.round(totalCaff),
        serving_size: serving_size || "1 serving",
        is_recipe: true,
        external_source: "manual",
      })
      .select()
      .single();

    if (recipeErr || !recipe) {
      return NextResponse.json(
        { error: recipeErr?.message || "Failed to create recipe" },
        { status: 500 }
      );
    }

    // Insert recipe ingredients
    const ingredientRows = ingredients.map((ing) => ({
      recipe_id: recipe.id,
      ingredient_id: ing.food_id,
      quantity: ing.quantity,
    }));

    const { error: ingErr } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientRows);

    if (ingErr) {
      return NextResponse.json(
        { error: `Recipe created but ingredients failed: ${ingErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(recipe);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("foods")
    .select("*, recipe_ingredients(quantity, ingredient:ingredient_id(id, name, calories, protein, carbs, fat))")
    .eq("created_by", user.id)
    .eq("is_recipe", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
