"use client";

import { useState, useTransition } from "react";
import { Search, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { searchFoods, logFood } from "./actions";
import { NotificationIcon, MenuIcon } from "@/components/nutrition/PageHeaderIcons";

// Mock initial data until we have a real DB seed


interface FoodItem {
    id: string;
    name: string;
    brand: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving_size: string;
}

export default function LogFoodPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<FoodItem[]>([]);
    const [, startTransition] = useTransition();
    const [selectedMeal, setSelectedMeal] = useState("Breakfast");

    const handleSearch = (term: string) => {
        setQuery(term);
        // In a real app, we'd debounce this. For now, we'll just show mock results if term > 2 chars
        // or fetch from server if we had a seeded DB.
        if (term.length > 1) {
            startTransition(async () => {
                const data = await searchFoods(term);
                setResults(data);
            });
        } else {
            setResults([]);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-md mx-auto md:max-w-4xl space-y-6 pb-24">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <NotificationIcon iconColor="currentColor" bgColor="rgba(255,255,255,0.1)" size={36} />
                    <h1 className="text-2xl font-display font-bold">Log Food</h1>
                </div>
                <MenuIcon iconColor="currentColor" bgColor="rgba(255,255,255,0.1)" size={36} />
            </header>

            {/* Meal Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
                    <button
                        key={meal}
                        onClick={() => setSelectedMeal(meal)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedMeal === meal
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {meal}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Search for food (e.g. 'Oatmeal')"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Results List */}
            <div className="space-y-3">
                {results.map((food) => (
                    <form key={food.id} action={logFood} className="glass-card p-4 rounded-xl flex justify-between items-center group">
                        <input type="hidden" name="foodId" value={food.id} />
                        <input type="hidden" name="mealName" value={selectedMeal} />

                        <div>
                            <p className="font-bold">{food.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {food.brand} • {food.calories} cal
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-xs text-right text-muted-foreground hidden sm:block">
                                <div>{food.protein}p</div>
                                <div>{food.carbs}c</div>
                            </div>
                            <button type="submit" className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                ))}

                {query.length > 1 && results.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No foods found. Try &quot;Oatmeal&quot; or &quot;Egg&quot;.
                    </div>
                )}
            </div>
        </div>
    );
}
