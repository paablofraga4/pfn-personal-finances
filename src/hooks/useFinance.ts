import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Transaction, Card, SavingsGoal, FinanceStats, ReportPeriod, MonthlyExpense, SavingsAssistant } from '../types/finance'
import { toast } from 'react-hot-toast'

export const useFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Si no hay usuario, usar un ID por defecto o crear uno anónimo
      const userId = user?.id || 'anonymous-user'
      
      console.log('Loading data for user:', userId)
      
      // Verificar el estado de autenticación
      const authState = await blink.auth.getState()
      console.log('Auth state:', authState)
      
      // Agregar timeout para evitar bloqueos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const dataPromise = Promise.all([
        blink.db.transactions.list({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' },
          limit: 100
        }).catch(() => []),
        blink.db.cards.list({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        blink.db.savingsGoals.list({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        blink.db.monthlyExpenses.list({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' }
        }).catch(() => [])
      ])
      
      const [transactionsData, cardsData, savingsGoalsData, monthlyExpensesData] = await Promise.race([
        dataPromise,
        timeoutPromise
      ])
      
      setTransactions(transactionsData || [])
      setCards(cardsData || [])
      setSavingsGoals(savingsGoalsData || [])
      setMonthlyExpenses(monthlyExpensesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      // En producción, no mostrar errores de red
      if (process.env.NODE_ENV === 'development') {
        toast.error('Error al cargar los datos')
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      console.log('Auth state changed:', state)
      setUser(state.user)
      setLoading(state.isLoading)
      
      if (state.user && !state.isLoading) {
        loadData()
      } else if (!state.user && !state.isLoading) {
        // Usuario no autenticado, limpiar datos
        setTransactions([])
        setCards([])
        setSavingsGoals([])
        setMonthlyExpenses([])
      }
    })
    return unsubscribe
  }, [loadData])

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const userId = user?.id || 'anonymous-user'
      console.log('Adding transaction:', { ...transaction, userId })
      
      const newTransaction = await blink.db.transactions.create({
        ...transaction,
        grossAmount: transaction.grossAmount,
        userId: userId,
        createdAt: new Date().toISOString()
      })
      
      console.log('Transaction created successfully:', newTransaction)
      setTransactions(prev => [newTransaction, ...prev])
      toast.success('Transacción agregada correctamente')
      return newTransaction
    } catch (error) {
      console.error('Error adding transaction:', error)
      console.error('Transaction data:', transaction)
      console.error('User ID:', user?.id)
      toast.error('Error al agregar la transacción')
      throw error
    }
  }

  const addCard = async (card: Omit<Card, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const newCard = await blink.db.cards.create({
        ...card,
        limitAmount: card.limit,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
      
      setCards(prev => [...prev, newCard])
      toast.success('Tarjeta agregada correctamente')
      return newCard
    } catch (error) {
      console.error('Error adding card:', error)
      toast.error('Error al agregar la tarjeta')
      throw error
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      await blink.db.transactions.delete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Transacción eliminada')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Error al eliminar la transacción')
    }
  }

  const deleteCard = async (id: string) => {
    try {
      await blink.db.cards.delete(id)
      setCards(prev => prev.filter(c => c.id !== id))
      toast.success('Tarjeta eliminada')
    } catch (error) {
      console.error('Error deleting card:', error)
      toast.error('Error al eliminar la tarjeta')
    }
  }

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const newGoal = await blink.db.savingsGoals.create({
        ...goal,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
      
      setSavingsGoals(prev => [...prev, newGoal])
      toast.success('Objetivo de ahorro creado')
      return newGoal
    } catch (error) {
      console.error('Error adding savings goal:', error)
      toast.error('Error al crear el objetivo de ahorro')
      throw error
    }
  }

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      await blink.db.savingsGoals.update(id, updates)
      setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
      toast.success('Objetivo actualizado')
    } catch (error) {
      console.error('Error updating savings goal:', error)
      toast.error('Error al actualizar el objetivo')
    }
  }

  const deleteSavingsGoal = async (id: string) => {
    try {
      await blink.db.savingsGoals.delete(id)
      setSavingsGoals(prev => prev.filter(g => g.id !== id))
      toast.success('Objetivo eliminado')
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      toast.error('Error al eliminar el objetivo')
    }
  }

  // Nuevas funciones para gastos mensuales
  const addMonthlyExpense = async (expense: Omit<MonthlyExpense, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const userId = user?.id || 'anonymous-user'
      console.log('Adding monthly expense:', { ...expense, userId })
      
      const newExpense = await blink.db.monthlyExpenses.create({
        ...expense,
        userId: userId,
        createdAt: new Date().toISOString()
      })
      
      console.log('Monthly expense created successfully:', newExpense)
      setMonthlyExpenses(prev => [...prev, newExpense])
      toast.success('Gasto mensual agregado correctamente')
      return newExpense
    } catch (error) {
      console.error('Error adding monthly expense:', error)
      console.error('Expense data:', expense)
      console.error('User ID:', user?.id)
      toast.error('Error al agregar el gasto mensual')
      throw error
    }
  }

  const updateMonthlyExpense = async (id: string, updates: Partial<MonthlyExpense>) => {
    try {
      await blink.db.monthlyExpenses.update(id, updates)
      setMonthlyExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
      toast.success('Gasto mensual actualizado')
    } catch (error) {
      console.error('Error updating monthly expense:', error)
      toast.error('Error al actualizar el gasto mensual')
    }
  }

  const deleteMonthlyExpense = async (id: string) => {
    try {
      await blink.db.monthlyExpenses.delete(id)
      setMonthlyExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Gasto mensual eliminado')
    } catch (error) {
      console.error('Error deleting monthly expense:', error)
      toast.error('Error al eliminar el gasto mensual')
    }
  }

  // Función para obtener gastos mensuales del mes actual
  const getCurrentMonthExpenses = () => {
    const now = new Date()
    const currentDay = now.getDate()
    
    return monthlyExpenses
      .filter(expense => expense.isActive && expense.dayOfMonth <= currentDay)
      .reduce((total, expense) => total + expense.amount, 0)
  }

  // Función para obtener el asistente de ahorro
  const getSavingsAssistant = (): SavingsAssistant => {
    const stats = getStats('monthly')
    const currentSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
    const monthlyIncome = stats.monthlyIncome
    const monthlyExpenses = stats.monthlyExpenses + getCurrentMonthExpenses()
    
    // Calcular presupuesto diario
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const dailyBudget = (monthlyIncome - monthlyExpenses) / daysInMonth
    
    // Calcular ahorro proyectado
    const projectedSavings = monthlyIncome - monthlyExpenses
    
    // Generar recomendaciones
    const recommendations: string[] = []
    const alerts: string[] = []
    
    if (projectedSavings < 0) {
      alerts.push('⚠️ Tu gasto mensual supera tus ingresos')
      recommendations.push('Revisa tus gastos no esenciales')
      recommendations.push('Considera reducir gastos en entretenimiento')
    } else if (projectedSavings < 200) {
      alerts.push('⚠️ Tu ahorro mensual es bajo')
      recommendations.push('Busca formas de aumentar tus ingresos')
      recommendations.push('Optimiza tus gastos fijos')
    } else {
      recommendations.push('¡Excelente! Mantén tu disciplina financiera')
      recommendations.push('Considera invertir parte de tus ahorros')
    }
    
    if (dailyBudget < 20) {
      alerts.push('⚠️ Tu presupuesto diario es muy bajo')
      recommendations.push('Revisa gastos recurrentes innecesarios')
    }
    
    return {
      monthlyGoal: 500, // Meta mensual por defecto
      currentSavings: currentSavings,
      projectedSavings: projectedSavings,
      recommendations,
      alerts,
      spendingLimit: monthlyExpenses,
      dailyBudget: Math.max(0, dailyBudget)
    }
  }

  const getStats = (period: ReportPeriod = 'monthly'): FinanceStats => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
    }

    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate
    )

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Stats mensuales
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyTransactions = transactions.filter(t => 
      new Date(t.date) >= monthStart
    )
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Stats semanales
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    const weeklyTransactions = transactions.filter(t => 
      new Date(t.date) >= weekStart
    )
    const weeklyIncome = weeklyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const weeklyExpenses = weeklyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Balance total
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular ahorros totales
    const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      weeklyIncome,
      weeklyExpenses,
      savingsRate,
      totalSavings
    }
  }

  return {
    transactions,
    cards,
    savingsGoals,
    monthlyExpenses,
    loading,
    user,
    addTransaction,
    addCard,
    deleteTransaction,
    deleteCard,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addMonthlyExpense,
    updateMonthlyExpense,
    deleteMonthlyExpense,
    getCurrentMonthExpenses,
    getSavingsAssistant,
    getStats,
    loadData
  }
}