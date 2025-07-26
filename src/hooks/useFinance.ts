import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Transaction, Card, SavingsGoal, FinanceStats, ReportPeriod } from '../types/finance'
import { toast } from 'react-hot-toast'

export const useFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const [transactionsData, cardsData, savingsGoalsData] = await Promise.all([
        blink.db.transactions.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 100
        }),
        blink.db.cards.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.savingsGoals.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
      ])
      
      setTransactions(transactionsData || [])
      setCards(cardsData || [])
      setSavingsGoals(savingsGoalsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadData()
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [loadData])



  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const newTransaction = await blink.db.transactions.create({
        ...transaction,
        grossAmount: transaction.grossAmount,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
      
      setTransactions(prev => [newTransaction, ...prev])
      toast.success('Transacción agregada correctamente')
      return newTransaction
    } catch (error) {
      console.error('Error adding transaction:', error)
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
    loading,
    user,
    addTransaction,
    addCard,
    deleteTransaction,
    deleteCard,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    getStats,
    loadData
  }
}