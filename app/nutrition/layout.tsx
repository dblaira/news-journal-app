import type { ReactNode } from 'react'

export const metadata = {
  title: 'Nutrition — understood',
}

export default function NutritionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="nutrition-theme min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
