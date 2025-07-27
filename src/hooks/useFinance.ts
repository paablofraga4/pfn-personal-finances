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
      
      setTransactions(transactionsResult.data || [])
      setCards(cardsResult.data || [])
      setSavingsGoals(savingsGoalsResult.data || [])
      setMonthlyExpenses(monthlyExpensesResult.data || [])
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
      
      // Estructura de datos ultra-simple para monthly expenses
      const simpleExpenseData = {
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        dayOfMonth: expense.dayOfMonth,
        isActive: expense.isActive,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
      
      try {
        console.log('📤 Attempting to create monthly expense with simple structure:', simpleExpenseData)
        
        const newExpense = await blink.db.monthlyExpenses.create(simpleExpenseData)
        
        console.log('✅ Monthly expense created successfully in database:', newExpense)
        setMonthlyExpenses(prev => [newExpense, ...prev])
        
        toast.success('Gasto mensual agregado correctamente')
        return newExpense
      } catch (dbError) {
        console.error('❌ Database creation failed:', dbError.message)
        console.log('🔧 This might be because the monthly_expenses table doesn\'t exist')
        
        // Intentar crear la tabla primero
        try {
          console.log('🔧 Attempting to create monthly_expenses table...')
          // Intentar crear un registro de prueba para forzar la creación de la tabla
          await blink.db.monthlyExpenses.create({
            name: 'Test Monthly Expense',
            amount: 0,
            category: 'otros',
            dayOfMonth: 1,
            isActive: true,
            userId: user.id,
            createdAt: new Date().toISOString()
          })
          console.log('✅ Monthly expenses table might have been created')
          
          // Ahora intentar crear el gasto real
          const newExpense = await blink.db.monthlyExpenses.create(simpleExpenseData)
          console.log('✅ Monthly expense created successfully after table creation:', newExpense)
          
          setMonthlyExpenses(prev => [newExpense, ...prev])
          
          toast.success('Gasto mensual agregado correctamente')
          return newExpense
        } catch (tableError) {
          console.error('❌ Table creation also failed:', tableError.message)
          
          // Fallback local definitivo
          console.error('❌ Using local fallback - monthly_expenses table not available')
          
          const tempId = `temp_${Date.now()}`
          const localExpense = {
            id: tempId,
            ...simpleExpenseData
          }
          
          console.log('✅ Monthly expense created locally:', localExpense)
          setMonthlyExpenses(prev => [localExpense, ...prev])
          
          toast.success('Gasto mensual agregado (guardada localmente)')
          return localExpense
        }
      }
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