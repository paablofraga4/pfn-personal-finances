import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { ReportPeriod } from '../types/finance'
import { getCategoryById } from '../data/categories'
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, PieChart, CreditCard, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export const Reports = () => {
  const { transactions, cards, getStats } = useFinance()
  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [selectedCard, setSelectedCard] = useState<string>('all')
  
  const stats = getStats(period)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case 'weekly': return 'Semanal'
      case 'monthly': return 'Mensual'
      case 'ytd': return 'Año hasta la fecha'
      case 'yearly': return 'Anual'
    }
  }

  const getFilteredTransactions = () => {
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

    let filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate)
    
    // Filtrar por tarjeta si está seleccionada
    if (selectedCard !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.cardId === selectedCard)
    }

    return filteredTransactions
  }

  const getCategoryBreakdown = () => {
    const filteredTransactions = getFilteredTransactions()
    const categoryTotals: { [key: string]: number } = {}

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount
      }
    })

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        category: getCategoryById(categoryId)?.name || 'Desconocido',
        amount,
        percentage: (amount / stats.totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  const getMonthlyTrend = () => {
    const monthlyData: { [key: string]: { income: number, expenses: number } } = {}
    
    let filteredTransactions = transactions
    
    // Filtrar por tarjeta si está seleccionada
    if (selectedCard !== 'all') {
      filteredTransactions = transactions.filter(t => t.cardId === selectedCard)
    }
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expenses += transaction.amount
      }
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        ingresos: data.income,
        gastos: data.expenses,
        balance: data.income - data.expenses
      }))
  }

  const getDailySpending = () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    let filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate)
    
    if (selectedCard !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.cardId === selectedCard)
    }
    
    const dailyData: { [key: string]: number } = {}
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const date = new Date(transaction.date)
        const dayKey = date.getDate().toString()
        dailyData[dayKey] = (dailyData[dayKey] || 0) + transaction.amount
      }
    })
    
    return Object.entries(dailyData)
      .map(([day, amount]) => ({
        day: parseInt(day),
        gastos: amount
      }))
      .sort((a, b) => a.day - b.day)
  }

  const categoryBreakdown = getCategoryBreakdown()
  const monthlyTrend = getMonthlyTrend()
  const dailySpending = getDailySpending()

  const pieChartData = categoryBreakdown.slice(0, 8).map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reportes Financieros</h2>
          <p className="text-muted-foreground">
            Analiza tus patrones de gasto e ingresos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: ReportPeriod) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="ytd">Año hasta la fecha</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCard} onValueChange={setSelectedCard}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Todas las tarjetas
                </div>
              </SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: card.color }}
                    />
                    <span>{card.name}</span>
                    <span className="text-muted-foreground">(**** {card.lastFourDigits})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gradient-card shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos {getPeriodLabel(period)}</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos {getPeriodLabel(period)}</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance {getPeriodLabel(period)}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalIncome - stats.totalExpenses >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(stats.totalIncome - stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="gradient-card shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `€${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="Ingresos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gastos" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                    name="Gastos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="gradient-card shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Gastos por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Gasto']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Chart */}
      <Card className="gradient-card shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Gastos Diarios del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="gastos" fill="#3b82f6" name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Details */}
      <Card className="gradient-card shadow-glow">
        <CardHeader>
          <CardTitle>Desglose Detallado por Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay gastos en este período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                    <span className="font-bold">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}