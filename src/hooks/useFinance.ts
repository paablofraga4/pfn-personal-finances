import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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
    
    if (!user) {
      console.log('Usuario no autenticado')
      setLoading(false)
      return
    }
    
    console.log('User is authenticated, loading data...')
    
    try {
      console.log('📊 Loading data from Supabase...')
      
      // Cargar datos usando Supabase directamente
      const [transactionsResult, cardsResult, savingsGoalsResult, monthlyExpensesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('monthly_expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ])
      
      console.log('📊 Supabase results:', {
        transactions: transactionsResult.data?.length || 0,
        cards: cardsResult.data?.length || 0,
        savingsGoals: savingsGoalsResult.data?.length || 0,
        monthlyExpenses: monthlyExpensesResult.data?.length || 0
      })
      
      if (transactionsResult.error) console.error('Error loading transactions:', transactionsResult.error)
      if (cardsResult.error) console.error('Error loading cards:', cardsResult.error)
      if (savingsGoalsResult.error) console.error('Error loading savings goals:', savingsGoalsResult.error)
      if (monthlyExpensesResult.error) console.error('Error loading monthly expenses:', monthlyExpensesResult.error)
      
      // Convertir datos de snake_case a camelCase
      const convertedTransactions = (transactionsResult.data || []).map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        cardId: t.card_id,
        grossAmount: t.gross_amount,
        userId: t.user_id,
        createdAt: t.created_at
      }))
      
      const convertedCards = (cardsResult.data || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        lastFourDigits: c.last_four_digits,
        limit: c.limit_amount,
        userId: c.user_id,
        createdAt: c.created_at
      }))
      
      const convertedSavingsGoals = (savingsGoalsResult.data || []).map(s => ({
        id: s.id,
        name: s.name,
        targetAmount: s.target_amount,
        currentAmount: s.current_amount,
        targetDate: s.target_date,
        userId: s.user_id,
        createdAt: s.created_at
      }))
      
      const convertedMonthlyExpenses = (monthlyExpensesResult.data || []).map(m => ({
        id: m.id,
        name: m.name,
        amount: m.amount,
        category: m.category,
        dayOfMonth: m.day_of_month,
        isActive: m.is_active,
        userId: m.user_id,
        createdAt: m.created_at
      }))
      
      setTransactions(convertedTransactions)
      setCards(convertedCards)
      setSavingsGoals(convertedSavingsGoals)
      setMonthlyExpenses(convertedMonthlyExpenses)
    } catch (error) {
      console.error('Error loading data:', error)
      if (process.env.NODE_ENV === 'development') {
        toast.error('Error al cargar los datos')
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setLoading(false)
        loadData()
      } else {
        setLoading(false)
      }
    }
    
    getInitialSession()
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('=== AUTH STATE CHANGED ===')
      console.log('Event:', event)
      console.log('User:', session?.user)
      console.log('User ID:', session?.user?.id)
      
      setUser(session?.user || null)
      setLoading(false)
      
      if (session?.user) {
        console.log('✅ User authenticated, loading data...')
        loadData()
      } else {
        console.log('❌ User not authenticated, clearing data...')
        setTransactions([])
        setCards([])
        setSavingsGoals([])
        setMonthlyExpenses([])
      }
    })
    
    return () => subscription.unsubscribe()
  }, [loadData])

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
      console.log('=== ADDING TRANSACTION ===')
      console.log('Transaction data:', { ...transaction, userId: user.id })
      console.log('User ID:', user?.id)
      
      // Estructura de datos para Supabase (snake_case)
      const transactionData = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        card_id: transaction.cardId,
        gross_amount: transaction.grossAmount,
        user_id: user.id,
        created_at: new Date().toISOString()
      }
      
      console.log('📤 Attempting to create transaction with Supabase:', transactionData)
      
      // Crear en Supabase
      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating transaction in database:', error)
        toast.error('Error al agregar la transacción')
        throw error
      }
      
      console.log('✅ Transaction created successfully in database:', newTransaction)
      
      // Convertir de snake_case a camelCase para el frontend
      const convertedTransaction = {
        id: newTransaction.id,
        description: newTransaction.description,
        amount: newTransaction.amount,
        type: newTransaction.type,
        category: newTransaction.category,
        cardId: newTransaction.card_id,
        grossAmount: newTransaction.gross_amount,
        userId: newTransaction.user_id,
        createdAt: newTransaction.created_at
      }
      
      setTransactions(prev => [convertedTransaction, ...prev])
      
      toast.success('Transacción agregada correctamente')
      return convertedTransaction
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
      console.log('Card data:', { ...card, user_id: user.id })
      console.log('User ID:', user?.id)
      
      // Preparar datos para Supabase (usar snake_case)
      const cardData = {
        name: card.name,
        type: card.type,
        last_four_digits: card.lastFourDigits,
        color: card.color,
        balance: card.balance,
        limit_amount: card.limit || 0,
        purpose: card.purpose || 'otros',
        user_id: user.id
      }
      
      console.log('📤 Creating card in Supabase:', cardData)
      
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert(cardData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating card:', error)
        toast.error('Error al agregar la tarjeta')
        throw error
      }
      
      console.log('✅ Card created successfully:', newCard)
      setCards(prev => {
        const newList = [...prev, newCard]
        console.log('New cards count:', newList.length)
        return newList
      })
      
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
      console.log('=== DELETING TRANSACTION ===')
      console.log('Transaction ID:', id)
      
      // Eliminar de Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Error deleting transaction from database:', error)
        toast.error('Error al eliminar la transacción')
        return
      }
      
      console.log('✅ Transaction deleted successfully from database')
      
      // Actualizar estado local
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Transacción eliminada correctamente')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Error al eliminar la transacción')
    }
  }

  const deleteCard = async (id: string) => {
    try {
      console.log('=== DELETING CARD ===')
      console.log('Card ID:', id)
      
      // Si es una tarjeta temporal, solo eliminar localmente
      if (id.startsWith('temp_card_')) {
        setCards(prev => prev.filter(c => c.id !== id))
        toast.success('Tarjeta eliminada')
        return
      }
      
      // Eliminar de Supabase
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Error deleting card from database:', error)
        toast.error('Error al eliminar la tarjeta')
        return
      }
      
      console.log('✅ Card deleted successfully from database')
      
      // Actualizar estado local
      setCards(prev => prev.filter(c => c.id !== id))
      toast.success('Tarjeta eliminada correctamente')
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
      
      // Estructura de datos para Supabase (snake_case)
      const expenseData = {
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        day_of_month: expense.dayOfMonth,
        is_active: expense.isActive,
        user_id: user.id,
        created_at: new Date().toISOString()
      }
      
      console.log('📤 Attempting to create monthly expense with Supabase:', expenseData)
      
      // Crear en Supabase
      const { data: newExpense, error } = await supabase
        .from('monthly_expenses')
        .insert(expenseData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating monthly expense in database:', error)
        toast.error('Error al agregar el gasto mensual')
        throw error
      }
      
      console.log('✅ Monthly expense created successfully in database:', newExpense)
      
      // Convertir de snake_case a camelCase para el frontend
      const convertedExpense = {
        id: newExpense.id,
        name: newExpense.name,
        amount: newExpense.amount,
        category: newExpense.category,
        dayOfMonth: newExpense.day_of_month,
        isActive: newExpense.is_active,
        userId: newExpense.user_id,
        createdAt: newExpense.created_at
      }
      
      setMonthlyExpenses(prev => [convertedExpense, ...prev])
      
      toast.success('Gasto mensual agregado correctamente')
      return convertedExpense
    } catch (error) {
      console.error('Error adding monthly expense:', error)
      toast.error('Error al agregar el gasto mensual')
      throw error
    }
  }

  const updateMonthlyExpense = async (id: string, updates: Partial<MonthlyExpense>) => {
    try {
      console.log('⚠️ WARNING: Monthly expenses table does not exist, updating locally')
      setMonthlyExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
      toast.success('Gasto mensual actualizado (localmente)')
    } catch (error) {
      console.error('Error updating monthly expense:', error)
      toast.error('Error al actualizar el gasto mensual')
    }
  }

  const deleteMonthlyExpense = async (id: string) => {
    try {
      console.log('=== DELETING MONTHLY EXPENSE ===')
      console.log('Monthly Expense ID:', id)
      
      // Eliminar de Supabase
      const { error } = await supabase
        .from('monthly_expenses')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Error deleting monthly expense from database:', error)
        toast.error('Error al eliminar el gasto mensual')
        return
      }
      
      console.log('✅ Monthly expense deleted successfully from database')
      
      // Actualizar estado local
      setMonthlyExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Gasto mensual eliminado correctamente')
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