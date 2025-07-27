import { Category } from '../types/finance'

export const categories: Category[] = [
  // Gastos
  { id: 'food', name: 'Comida', icon: '🍽️', color: '#ef4444' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#8b5cf6' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬', color: '#f59e0b' },
  { id: 'health', name: 'Salud', icon: '🏥', color: '#10b981' },
  { id: 'education', name: 'Educación', icon: '📚', color: '#06b6d4' },
  { id: 'utilities', name: 'Servicios', icon: '💡', color: '#84cc16' },
  { id: 'rent', name: 'Alquiler', icon: '🏠', color: '#f97316' },
  { id: 'other-expense', name: 'Otros Gastos', icon: '💸', color: '#6b7280' },
  
  // Ingresos
  { id: 'salary', name: 'Salario', icon: '💰', color: '#22c55e' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#8b5cf6' },
  { id: 'gift', name: 'Regalo', icon: '🎁', color: '#ec4899' },
  { id: 'other-income', name: 'Otros Ingresos', icon: '💵', color: '#10b981' },
  
  // Gastos de Trabajo e Inversiones
  { id: 'work', name: 'Trabajo', icon: '💼', color: '#3b82f6' },
  { id: 'investment', name: 'Inversiones', icon: '📈', color: '#f59e0b' },
]

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find(cat => cat.id === id)
}

// Log todas las categorías disponibles para debugging
console.log('🔍 All categories available:', categories.map(c => `${c.name} (${c.id})`))

export const getExpenseCategories = (): Category[] => {
  const expenseCategories = categories.filter(cat => !cat.id.includes('income') && !cat.id.includes('salary') && !cat.id.includes('freelance') && !cat.id.includes('gift'))
  console.log('🔍 getExpenseCategories - Found:', expenseCategories.length, 'categories at', new Date().toISOString())
  console.log('🔍 getExpenseCategories - Categories:', expenseCategories.map(c => c.name))
  return expenseCategories
}

export const getIncomeCategories = (): Category[] => {
  const incomeCategories = categories.filter(cat => cat.id.includes('income') || cat.id.includes('salary') || cat.id.includes('freelance') || cat.id.includes('gift'))
  console.log('🔍 getIncomeCategories - Found:', incomeCategories.length, 'categories at', new Date().toISOString())
  console.log('🔍 getIncomeCategories - Categories:', incomeCategories.map(c => c.name))
  return incomeCategories
}