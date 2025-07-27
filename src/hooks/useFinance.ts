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
    if (!user?.id) {
      console.log('No user ID available')
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    console.log('Loading data for user:', user.id)
    
    // Verificar el estado de autenticación - usar el estado actual en lugar de getState()
    console.log('Auth state from context:', { user, loading })
    
    if (!user) {
      console.log('Usuario no autenticado')
      setLoading(false)
      return
    }
    
    console.log('User is authenticated, loading data...')
    
    // Cargar datos directamente sin verificación adicional
    console.log('Loading data directly...')
    
    try {
      const [transactionsData, cardsData, savingsGoalsData, monthlyExpensesData] = await Promise.all([
        blink.db.transactions.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 100
        }).catch(() => []),
        blink.db.cards.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        blink.db.savingsGoals.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        blink.db.monthlyExpenses.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }).catch(() => [])
      ])
      
      console.log('Data loaded:', {
        transactions: transactionsData?.length || 0,
        cards: cardsData?.length || 0,
        savingsGoals: savingsGoalsData?.length || 0,
        monthlyExpenses: monthlyExpensesData?.length || 0
      })
      
      console.log('Cards data details:', cardsData)
      console.log('Setting cards state with:', cardsData || [])
      
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
      console.log('=== AUTH STATE CHANGED ===')
      console.log('State:', state)
      console.log('User:', state.user)
      console.log('IsLoading:', state.isLoading)
      console.log('User ID:', state.user?.id)
      
      setUser(state.user)
      setLoading(state.isLoading)
      
      if (state.user && !state.isLoading) {
        console.log('✅ User authenticated, loading data...')
        loadData()
      } else if (!state.user && !state.isLoading) {
        console.log('❌ User not authenticated, clearing data...')
        // Usuario no autenticado, limpiar datos
        setTransactions([])
        setCards([])
        setSavingsGoals([])
        setMonthlyExpenses([])
      } else {
        console.log('⏳ Still loading or in transition...')
      }
    })
    return unsubscribe
  }, [loadData])

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
      console.log('=== ADDING TRANSACTION ===')
      console.log('Transaction data:', { ...transaction, userId: user.id })
      console.log('User ID:', user?.id)
      console.log('User object:', user)
      
      // Verificar que la tabla existe
      console.log('Checking if transactions table exists...')
      
      const newTransaction = await blink.db.transactions.create({
        ...transaction,
        grossAmount: transaction.grossAmount,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
      
      console.log('✅ Transaction created successfully:', newTransaction)
      console.log('Previous transactions count:', transactions.length)
      setTransactions(prev => {
        const newList = [newTransaction, ...prev]
        console.log('New transactions count:', newList.length)
        return newList
      })
      
      // Verificar que se guardó correctamente
      setTimeout(async () => {
        try {
          console.log('🔍 Verificando que la transacción se guardó...')
          const savedTransactions = await blink.db.transactions.list({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            limit: 5
          })
          console.log('📊 Transacciones guardadas:', savedTransactions)
        } catch (error) {
          console.error('❌ Error verificando transacciones:', error)
        }
      }, 1000)
      
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
      console.log('=== ADDING CARD ===')
      console.log('Card data:', { ...card, userId: user.id })
      console.log('User ID:', user?.id)
      console.log('User object:', user)
      
      // Verificar que la tabla existe
      console.log('Checking if cards table exists...')
      
      const newCard = await blink.db.cards.create({
        ...card,
        limitAmount: card.limit,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
      
      console.log('✅ Card created successfully:', newCard)
      console.log('Previous cards count:', cards.length)
      setCards(prev => {
        const newList = [...prev, newCard]
        console.log('New cards count:', newList.length)
        return newList
      })
      
      // Verificar que se guardó correctamente
      setTimeout(async () => {
        try {
          console.log('🔍 Verificando que la tarjeta se guardó...')
          const savedCards = await blink.db.cards.list({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            limit: 5
          })
          console.log('📊 Tarjetas guardadas:', savedCards)
        } catch (error) {
          console.error('❌ Error verificando tarjetas:', error)
        }
      }, 1000)
      
      toast.success('Tarjeta agregada correctamente')
      return newCard
    } catch (error) {
      console.error('Error adding card:', error)
      console.error('Card data:', card)
      console.error('User ID:', user?.id)
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
      console.log('=== ADDING MONTHLY EXPENSE ===')
      console.log('Expense data:', { ...expense, userId: user.id })
      console.log('User ID:', user?.id)
      console.log('User object:', user)
      
      // Verificar que la tabla existe
      console.log('Checking if monthlyExpenses table exists...')
      
      const newExpense = await blink.db.monthlyExpenses.create({
        ...expense,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
      
      console.log('✅ Monthly expense created successfully:', newExpense)
      console.log('Previous monthly expenses count:', monthlyExpenses.length)
      setMonthlyExpenses(prev => {
        const newList = [...prev, newExpense]
        console.log('New monthly expenses count:', newList.length)
        return newList
      })
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