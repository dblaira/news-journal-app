import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const barcode = request.nextUrl.searchParams.get("code");
  if (!barcode) {
    return NextResponse.json({ error: "Barcode code is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}`,
      {
        headers: { "User-Agent": "NutritionApp/1.0 (contact@example.com)" },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Product not found", barcode },
        { status: 404 }
      );
    }

    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json(
        { error: "Product not found in Open Food Facts", barcode },
        { status: 404 }
      );
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    // Normalize to per-serving values
    const servingSize = p.serving_size || p.quantity || "100g";
    const calories = Math.round(
      nutriments["energy-kcal_serving"] ||
        nutriments["energy-kcal_100g"] ||
        0
    );
    const protein = Math.round(
      (nutriments.proteins_serving || nutriments.proteins_100g || 0) * 10
    ) / 10;
    const carbs = Math.round(
      (nutriments.carbohydrates_serving || nutriments.carbohydrates_100g || 0) * 10
    ) / 10;
    const fat = Math.round(
      (nutriments.fat_serving || nutriments.fat_100g || 0) * 10
    ) / 10;

    return NextResponse.json({
      found: true,
      barcode,
      name: p.product_name || p.product_name_en || "Unknown Product",
      brand: p.brands || null,
      serving_size: servingSize,
      calories,
      protein,
      carbs,
      fat,
      image_url: p.image_front_small_url || null,
      source: "open_food_facts",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Lookup failed: ${e.message}` },
      { status: 500 }
    );
  }
}
