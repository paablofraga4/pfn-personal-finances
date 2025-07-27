export interface Transaction {
  id: string
  userId: string
  amount: number
  grossAmount?: number // Para ingresos brutos (antes de impuestos)
  description: string
  category: string
  type: 'income' | 'expense'
  cardId?: string
  date: string
  createdAt: string
  isRecurring?: boolean
  recurringId?: string
}

export interface Card {
  id: string
  userId: string
  name: string
  type: 'credit' | 'debit'
  lastFourDigits: string
  color: string
  balance: number
  limit?: number
  limitAmount?: number
  purpose?: 'gastos_corrientes' | 'dolares' | 'gastos_mensuales' | 'otros'
  createdAt: string
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  category: string
  icon: string
  color: string
  createdAt: string
}

export interface MonthlyExpense {
  id: string
  userId: string
  name: string
  amount: number
  category: string
  cardId?: string
  dayOfMonth: number // Día del mes en que se cobra (1-31)
  isActive: boolean
  description?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export type ReportPeriod = 'weekly' | 'monthly' | 'ytd' | 'yearly'

export interface FinanceStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
  weeklyIncome: number
  weeklyExpenses: number
  savingsRate: number
  totalSavings: number
}

export interface SavingsAssistant {
  monthlyGoal: number
  currentSavings: number
  projectedSavings: number
  recommendations: string[]
  alerts: string[]
  spendingLimit: number
  dailyBudget: number
}