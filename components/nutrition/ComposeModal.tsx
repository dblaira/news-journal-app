'use client'

import { useState, useRef, useEffect } from 'react'
import { searchFoods } from '@/app/nutrition/log-food/actions'
import { saveIntake } from '@/app/nutrition/actions/intake'
import { debugFetch } from '@/lib/nutrition/debug-fetch'
import { C } from '@/lib/nutrition/colors'

interface FoodEntry {
  id?: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  caffeine_mg: number
  isCustom: boolean
}

type ComposeMode = 'log_meal' | 'custom_food' | 'recipe_builder' | 'supplement_config'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const [mode, setMode] = useState<ComposeMode>('log_meal')

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: 'min(520px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 64px)',
        background: C.white,
        borderRadius: 24,
        boxShadow: '0 12px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header with mode tabs */}
        <div style={{
          padding: '20px 24px 0',
          borderBottom: `2px solid ${C.sand}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 800,
              color: C.charcoal,
              fontFamily: "'Outfit', sans-serif",
            }}>
              Compose
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: C.warmGray,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: -2, overflowX: 'auto' }}>
            {([
              { id: 'log_meal', label: 'Log Meal' },
              { id: 'custom_food', label: 'Custom Food' },
              { id: 'recipe_builder', label: 'Recipes' },
              { id: 'supplement_config', label: 'Supplements' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                style={{
                  padding: '10px 16px',
                  background: mode === tab.id ? C.white : 'transparent',
                  border: mode === tab.id ? `2px solid ${C.sand}` : '2px solid transparent',
                  borderBottom: mode === tab.id ? `2px solid ${C.white}` : '2px solid transparent',
                  borderRadius: '12px 12px 0 0',
                  fontSize: '0.8rem',
                  fontWeight: mode === tab.id ? 700 : 500,
                  color: mode === tab.id ? C.charcoal : C.warmGray,
                  cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {mode === 'log_meal' && <LogMealForm onSuccess={onSuccess} onClose={onClose} />}
          {mode === 'custom_food' && <CustomFoodForm onSuccess={onSuccess} onClose={onClose} />}
          {mode === 'recipe_builder' && <RecipeBuilderForm onSuccess={onSuccess} onClose={onClose} />}
          {mode === 'supplement_config' && <SupplementConfigForm onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// LOG MEAL FORM
// ═══════════════════════════════════════════════════
function LogMealForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [mealName, setMealName] = useState('Breakfast')
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const searchTimeout = useRef<NodeJS.Timeout>()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    clearTimeout(searchTimeout.current)
    if (query.length < 2) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchFoods(query)
      setSearchResults(results)
    }, 300)
  }

  const addFood = (food: any) => {
    setEntries(prev => [...prev, {
      id: food.id,
      name: food.name,
      quantity: 1,
      unit: food.serving_size || '1 serving',
      calories: food.calories,
      protein: Number(food.protein),
      carbs: Number(food.carbs),
      fat: Number(food.fat),
      caffeine_mg: Number(food.caffeine_mg || 0),
      isCustom: false,
    }])
    setSearchQuery('')
    setSearchResults([])
  }

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, qty: number) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, quantity: qty } : e))
  }

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + e.calories * e.quantity,
    protein: acc.protein + e.protein * e.quantity,
    carbs: acc.carbs + e.carbs * e.quantity,
    fat: acc.fat + e.fat * e.quantity,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const handleSubmit = async () => {
    if (entries.length === 0) return
    setIsSubmitting(true)
    setError('')

    const result = await saveIntake({
      type: 'food',
      meal_name: mealName,
      items: entries.map(e => ({
        name: e.name,
        quantity: e.quantity,
        unit: e.unit,
        calories: e.calories,
        protein: e.protein,
        carbs: e.carbs,
        fat: e.fat,
        caffeine_mg: e.caffeine_mg,
      })),
      external_source: 'manual',
    })

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div>
      {/* Meal selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
          <button
            key={m}
            onClick={() => setMealName(m)}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              background: mealName === m ? C.orange : C.sand,
              color: mealName === m ? C.white : C.charcoal,
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Food search */}
      <input
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search foods to add..."
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: `2px solid ${C.sand}`,
          background: C.cream,
          fontSize: '0.9rem',
          fontFamily: "'Outfit', sans-serif",
          outline: 'none',
          color: C.charcoal,
          marginBottom: 8,
        }}
      />

      {/* Search results */}
      {searchResults.length > 0 && (
        <div style={{
          maxHeight: 180,
          overflowY: 'auto',
          borderRadius: 12,
          border: `1px solid ${C.sand}`,
          marginBottom: 16,
        }}>
          {searchResults.map((food: any) => (
            <button
              key={food.id}
              onClick={() => addFood(food)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${C.sand}`,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600, color: C.charcoal, fontSize: '0.85rem' }}>
                {food.name}
              </span>
              <span style={{ color: C.warmGray, fontSize: '0.8rem' }}>
                {food.calories} cal
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Current entries */}
      {entries.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {entries.map((entry, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: C.cream,
              borderRadius: 12,
              marginBottom: 6,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: C.charcoal, fontFamily: "'Outfit', sans-serif" }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>
                  {Math.round(entry.calories * entry.quantity)} cal · P:{Math.round(entry.protein * entry.quantity)}g · C:{Math.round(entry.carbs * entry.quantity)}g · F:{Math.round(entry.fat * entry.quantity)}g
                </div>
              </div>
              <input
                type="number"
                value={entry.quantity}
                onChange={(e) => updateQuantity(i, Math.max(0.25, Number(e.target.value)))}
                min={0.25}
                step={0.25}
                style={{
                  width: 56,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1px solid ${C.sand}`,
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  fontFamily: "'Outfit', sans-serif",
                }}
              />
              <button
                onClick={() => removeEntry(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.red,
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Totals */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '14px',
            background: C.sand,
            borderRadius: 14,
            marginTop: 10,
          }}>
            {[
              { label: 'Cal', val: Math.round(totals.calories), color: C.orange },
              { label: 'P', val: Math.round(totals.protein), color: C.red },
              { label: 'C', val: Math.round(totals.carbs), color: C.ocean },
              { label: 'F', val: Math.round(totals.fat), color: C.orange },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: m.color, fontFamily: "'Outfit', sans-serif" }}>
                  {m.val}{m.label !== 'Cal' ? 'g' : ''}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: C.red, fontSize: '0.8rem', marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || entries.length === 0}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          border: 'none',
          background: entries.length > 0 ? C.orange : C.sand,
          color: entries.length > 0 ? C.white : C.warmGray,
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: entries.length > 0 ? 'pointer' : 'not-allowed',
          fontFamily: "'Outfit', sans-serif",
          opacity: isSubmitting ? 0.55 : 1,
        }}
      >
        {isSubmitting ? 'Saving...' : 'Log Meal'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// CUSTOM FOOD FORM
// ═══════════════════════════════════════════════════
function CustomFoodForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', brand: '', serving_size: '', calories: '',
    protein: '', carbs: '', fat: '', caffeine_mg: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name || !form.calories) {
      setError('Name and calories are required')
      return
    }
    setIsSubmitting(true)

    try {
      const res = await debugFetch('/api/custom-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand || null,
          serving_size: form.serving_size || '1 serving',
          calories: Number(form.calories),
          protein: Number(form.protein) || 0,
          carbs: Number(form.carbs) || 0,
          fat: Number(form.fat) || 0,
          caffeine_mg: Number(form.caffeine_mg) || 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create food')
        setIsSubmitting(false)
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('Network error')
      setIsSubmitting(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `2px solid ${C.sand}`,
    background: C.cream,
    fontSize: '0.85rem',
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    color: C.charcoal,
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '0.75rem',
    fontWeight: 600 as const,
    color: C.warmGray,
    marginBottom: 4,
    fontFamily: "'Outfit', sans-serif",
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Food Name *</label>
        <input style={fieldStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. My Protein Shake" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Brand</label>
          <input style={fieldStyle} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Optional" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Serving Size</label>
          <input style={fieldStyle} value={form.serving_size} onChange={e => setForm({ ...form, serving_size: e.target.value })} placeholder="e.g. 1 scoop" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Calories *</label>
          <input style={fieldStyle} type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Protein (g)</label>
          <input style={fieldStyle} type="number" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Carbs (g)</label>
          <input style={fieldStyle} type="number" value={form.carbs} onChange={e => setForm({ ...form, carbs: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Fat (g)</label>
          <input style={fieldStyle} type="number" value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Caffeine (mg)</label>
        <input style={{ ...fieldStyle, width: '50%' }} type="number" value={form.caffeine_mg} onChange={e => setForm({ ...form, caffeine_mg: e.target.value })} placeholder="0" />
      </div>

      {error && <p style={{ color: C.red, fontSize: '0.8rem', marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>{error}</p>}

      <button onClick={handleSubmit} disabled={isSubmitting} style={{
        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
        background: C.orange, color: C.white, fontSize: '0.95rem', fontWeight: 700,
        cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
        opacity: isSubmitting ? 0.55 : 1,
      }}>
        {isSubmitting ? 'Creating...' : 'Create Custom Food'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// SUPPLEMENT CONFIGURATION FORM
// ═══════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SupplementConfigForm({ onClose }: { onClose: () => void }) {
  const [supplements, setSupplements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newSup, setNewSup] = useState({ name: '', brand: '', dosage: '', time: 'morning', stock: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchSupplements()
  }, [])

  const fetchSupplements = async () => {
    const res = await debugFetch('/api/supplements')
    if (res.ok) {
      const data = await res.json()
      setSupplements(data)
    }
    setIsLoading(false)
  }

  const handleAdd = async () => {
    if (!newSup.name) return
    setIsAdding(true)
    const res = await debugFetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSup.name,
        brand: newSup.brand || null,
        default_dosage: newSup.dosage || null,
        time_of_day: newSup.time,
        current_stock: newSup.stock ? Number(newSup.stock) : null,
      }),
    })
    if (res.ok) {
      setNewSup({ name: '', brand: '', dosage: '', time: 'morning', stock: '' })
      fetchSupplements()
    }
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/supplements?id=${id}`, { method: 'DELETE' })
    fetchSupplements()
  }

  const fieldStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `2px solid ${C.sand}`,
    background: C.cream,
    fontSize: '0.8rem',
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    color: C.charcoal,
  }

  return (
    <div>
      {/* Existing supplements */}
      {isLoading ? (
        <p style={{ color: C.warmGray, fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif" }}>Loading...</p>
      ) : supplements.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          {supplements.map((sup: any) => (
            <div key={sup.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: C.cream, borderRadius: 12, marginBottom: 6,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: C.charcoal, fontFamily: "'Outfit', sans-serif" }}>
                  {sup.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>
                  {sup.default_dosage || 'No dosage set'} · {sup.time_of_day} · {sup.current_stock != null ? `${sup.current_stock} left` : 'No stock tracking'}
                </div>
              </div>
              <button onClick={() => handleDelete(sup.id)} style={{
                background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '1rem',
              }}>×</button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: C.warmGray, fontSize: '0.85rem', marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
          No supplements configured yet. Add your daily stack below.
        </p>
      )}

      {/* Add new */}
      <div style={{ padding: 16, background: C.sand, borderRadius: 16 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: C.charcoal, fontFamily: "'Outfit', sans-serif" }}>
          Add Supplement
        </h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input style={{ ...fieldStyle, flex: 2 }} placeholder="Name *" value={newSup.name} onChange={e => setNewSup({ ...newSup, name: e.target.value })} />
          <input style={{ ...fieldStyle, flex: 1 }} placeholder="Brand" value={newSup.brand} onChange={e => setNewSup({ ...newSup, brand: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input style={{ ...fieldStyle, flex: 1 }} placeholder="Dosage (e.g. 1 scoop)" value={newSup.dosage} onChange={e => setNewSup({ ...newSup, dosage: e.target.value })} />
          <select style={{ ...fieldStyle, flex: 1 }} value={newSup.time} onChange={e => setNewSup({ ...newSup, time: e.target.value })}>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="pre_workout">Pre-workout</option>
            <option value="anytime">Anytime</option>
          </select>
          <input style={{ ...fieldStyle, flex: 0.5 }} type="number" placeholder="Stock" value={newSup.stock} onChange={e => setNewSup({ ...newSup, stock: e.target.value })} />
        </div>
        <button onClick={handleAdd} disabled={isAdding || !newSup.name} style={{
          width: '100%', padding: '10px', borderRadius: 10, border: 'none',
          background: newSup.name ? C.orange : C.warmGray, color: C.white,
          fontSize: '0.85rem', fontWeight: 700, cursor: newSup.name ? 'pointer' : 'not-allowed',
          fontFamily: "'Outfit', sans-serif", opacity: isAdding ? 0.55 : 1,
        }}>
          {isAdding ? 'Adding...' : 'Add to Stack'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// RECIPE BUILDER FORM
// ═══════════════════════════════════════════════════
function RecipeBuilderForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [recipeName, setRecipeName] = useState('')
  const [servingSize, setServingSize] = useState('1 serving')
  const [ingredients, setIngredients] = useState<{ id: string; name: string; quantity: number; calories: number; protein: number; carbs: number; fat: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recipes, setRecipes] = useState<any[]>([])
  const searchTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    debugFetch('/api/recipes').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRecipes(data)
    })
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    clearTimeout(searchTimeout.current)
    if (query.length < 2) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchFoods(query)
      setSearchResults(results.filter((f: any) => !f.is_recipe))
    }, 300)
  }

  const addIngredient = (food: any) => {
    setIngredients(prev => [...prev, {
      id: food.id,
      name: food.name,
      quantity: 1,
      calories: food.calories,
      protein: Number(food.protein),
      carbs: Number(food.carbs),
      fat: Number(food.fat),
    }])
    setSearchQuery('')
    setSearchResults([])
  }

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const updateQty = (index: number, qty: number) => {
    setIngredients(prev => prev.map((e, i) => i === index ? { ...e, quantity: qty } : e))
  }

  const totals = ingredients.reduce((acc, e) => ({
    calories: acc.calories + e.calories * e.quantity,
    protein: acc.protein + e.protein * e.quantity,
    carbs: acc.carbs + e.carbs * e.quantity,
    fat: acc.fat + e.fat * e.quantity,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const handleSubmit = async () => {
    if (!recipeName || ingredients.length === 0) {
      setError('Name and at least one ingredient required')
      return
    }
    setIsSubmitting(true)
    setError('')

    const res = await debugFetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: recipeName,
        serving_size: servingSize,
        ingredients: ingredients.map(i => ({ food_id: i.id, quantity: i.quantity })),
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to create recipe')
      setIsSubmitting(false)
      return
    }

    onSuccess()
    onClose()
  }

  const fieldStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `2px solid ${C.sand}`,
    background: C.cream,
    fontSize: '0.85rem',
    fontFamily: "'Outfit', sans-serif",
    outline: 'none',
    color: C.charcoal,
  }

  return (
    <div>
      {/* Existing recipes */}
      {recipes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 700, color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>
            Your Recipes
          </h4>
          {recipes.map((r: any) => (
            <div key={r.id} style={{
              padding: '10px 14px', background: C.cream, borderRadius: 12, marginBottom: 6,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: C.charcoal, fontFamily: "'Outfit', sans-serif" }}>
                {r.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>
                {r.calories} cal · P:{Math.round(Number(r.protein))}g · C:{Math.round(Number(r.carbs))}g · F:{Math.round(Number(r.fat))}g
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New recipe form */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 2 }}>
          <input style={fieldStyle} placeholder="Recipe Name *" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <input style={fieldStyle} placeholder="Serving size" value={servingSize} onChange={e => setServingSize(e.target.value)} />
        </div>
      </div>

      {/* Ingredient search */}
      <input
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search ingredients to add..."
        style={{ ...fieldStyle, marginBottom: 8 }}
      />

      {searchResults.length > 0 && (
        <div style={{
          maxHeight: 150, overflowY: 'auto', borderRadius: 12,
          border: `1px solid ${C.sand}`, marginBottom: 12,
        }}>
          {searchResults.map((food: any) => (
            <button key={food.id} onClick={() => addIngredient(food)} style={{
              width: '100%', padding: '8px 14px', background: 'transparent', border: 'none',
              borderBottom: `1px solid ${C.sand}`, textAlign: 'left', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif", display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 600, color: C.charcoal, fontSize: '0.8rem' }}>{food.name}</span>
              <span style={{ color: C.warmGray, fontSize: '0.75rem' }}>{food.calories} cal</span>
            </button>
          ))}
        </div>
      )}

      {/* Ingredients list */}
      {ingredients.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {ingredients.map((ing, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: C.cream, borderRadius: 10, marginBottom: 4,
            }}>
              <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: C.charcoal, fontFamily: "'Outfit', sans-serif" }}>
                {ing.name}
              </div>
              <input type="number" value={ing.quantity} onChange={e => updateQty(i, Math.max(0.25, Number(e.target.value)))}
                min={0.25} step={0.25} style={{
                  width: 50, padding: '4px 6px', borderRadius: 6, border: `1px solid ${C.sand}`,
                  textAlign: 'center', fontSize: '0.75rem', fontFamily: "'Outfit', sans-serif",
                }} />
              <button onClick={() => removeIngredient(i)} style={{
                background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '1rem',
              }}>×</button>
            </div>
          ))}

          <div style={{
            display: 'flex', justifyContent: 'space-around', padding: '10px',
            background: C.sand, borderRadius: 12, marginTop: 8,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: C.orange, fontFamily: "'Outfit', sans-serif" }}>{Math.round(totals.calories)}</div>
              <div style={{ fontSize: '0.6rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>Cal</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: C.red, fontFamily: "'Outfit', sans-serif" }}>{Math.round(totals.protein)}g</div>
              <div style={{ fontSize: '0.6rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>P</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: C.ocean, fontFamily: "'Outfit', sans-serif" }}>{Math.round(totals.carbs)}g</div>
              <div style={{ fontSize: '0.6rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>C</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: C.orange, fontFamily: "'Outfit', sans-serif" }}>{Math.round(totals.fat)}g</div>
              <div style={{ fontSize: '0.6rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif" }}>F</div>
            </div>
          </div>
        </div>
      )}

      {error && <p style={{ color: C.red, fontSize: '0.8rem', marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>{error}</p>}

      <button onClick={handleSubmit} disabled={isSubmitting || !recipeName || ingredients.length === 0} style={{
        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
        background: recipeName && ingredients.length > 0 ? C.orange : C.sand,
        color: recipeName && ingredients.length > 0 ? C.white : C.warmGray,
        fontSize: '0.95rem', fontWeight: 700,
        cursor: recipeName && ingredients.length > 0 ? 'pointer' : 'not-allowed',
        fontFamily: "'Outfit', sans-serif", opacity: isSubmitting ? 0.55 : 1,
      }}>
        {isSubmitting ? 'Creating...' : 'Save Recipe'}
      </button>
    </div>
  )
}
