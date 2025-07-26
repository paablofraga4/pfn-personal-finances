import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { BalanceChart } from './BalanceChart'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Calendar,
  Eye,
  EyeOff,
  Receipt,
  Banknote
} from 'lucide-react'
import { useState } from 'react'
import { getCategoryById } from '../data/categories'
import { formatCurrency, formatCurrencyCompact } from '../lib/currency'

export const ImprovedDashboard = () => {
  const { transactions, cards, savingsGoals, getStats } = useFinance()
  const [showBalances, setShowBalances] = useState(true)
  
  const stats = getStats('monthly')
  const recentTransactions = transactions.slice(0, 4)

  const formatCurrency = (amount: number, hideAmount = false) => {
    if (hideAmount) return '••••'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Calcular progreso de objetivos
  const totalGoalsTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const totalGoalsCurrent = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const goalsProgress = totalGoalsTarget > 0 ? (totalGoalsCurrent / totalGoalsTarget) * 100 : 0

  // Obtener tarjetas por propósito
  const cardsByPurpose = {
    gastos_corrientes: cards.filter(c => c.purpose === 'gastos_corrientes'),
    dolares: cards.filter(c => c.purpose === 'dolares'),
    gastos_mensuales: cards.filter(c => c.purpose === 'gastos_mensuales'),
    otros: cards.filter(c => c.purpose === 'otros' || !c.purpose)
  }

  const purposeLabels = {
    gastos_corrientes: 'Gastos Corrientes',
    dolares: 'Cuenta USD',
    gastos_mensuales: 'Gastos Mensuales',
    otros: 'Otras Tarjetas'
  }

  const purposeIcons = {
    gastos_corrientes: '💳',
    dolares: '💵',
    gastos_mensuales: '🏠',
    otros: '💰'
  }

  // Calcular ingresos brutos vs netos del mes
  const monthlyGrossIncome = transactions
    .filter(t => {
      const transactionDate = new Date(t.date)
      const now = new Date()
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear() &&
             t.type === 'income'
    })
    .reduce((sum, t) => sum + (t.grossAmount || t.amount), 0)

  const monthlyNetIncome = transactions
    .filter(t => {
      const transactionDate = new Date(t.date)
      const now = new Date()
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear() &&
             t.type === 'income'
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyTaxes = monthlyGrossIncome - monthlyNetIncome

  return (
    <div className="space-y-6 pb-20">
      {/* Header con balance principal */}
      <Card className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-purple-100 text-sm font-medium">Balance Neto Total</p>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">
                  {formatCurrency(stats.balance, !showBalances)}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalances(!showBalances)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-sm font-medium">Tasa de Ahorro</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {stats.savingsRate.toFixed(1)}%
                </p>
                {stats.savingsRate > 20 ? (
                  <TrendingUp className="h-5 w-5 text-green-300" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-yellow-300" />
                )}
              </div>
            </div>
          </div>
          
          {/* Ingresos brutos vs netos */}
          {monthlyTaxes > 0 && (
            <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-100 font-medium">Este Mes</span>
                <Receipt className="h-4 w-4 text-purple-200" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-purple-200">Bruto</p>
                  <p className="font-semibold">
                    {formatCurrency(monthlyGrossIncome, !showBalances)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-200">Impuestos</p>
                  <p className="font-semibold text-red-300">
                    -{formatCurrency(monthlyTaxes, !showBalances)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-200">Neto</p>
                  <p className="font-semibold text-green-300">
                    {formatCurrency(monthlyNetIncome, !showBalances)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-sm text-purple-100 font-medium">Ingresos Netos</span>
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(stats.monthlyIncome, !showBalances)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="h-4 w-4 text-red-300" />
                <span className="text-sm text-purple-100 font-medium">Gastos</span>
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(stats.monthlyExpenses, !showBalances)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfica de balance */}
      <BalanceChart />

      {/* Stats rápidas mejoradas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <PiggyBank className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">Ahorros Totales</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalSavings, !showBalances)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700 font-medium">Esta Semana</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.weeklyExpenses, !showBalances)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Objetivos de ahorro - resumen mejorado */}
      {savingsGoals.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Target className="h-5 w-5" />
                Objetivos de Ahorro
              </CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {savingsGoals.length} objetivo{savingsGoals.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-amber-800">Progreso General</span>
                <span className="text-sm text-amber-600">
                  {formatCurrency(totalGoalsCurrent)} / {formatCurrency(totalGoalsTarget)}
                </span>
              </div>
              <Progress value={goalsProgress} className="h-3 bg-amber-100" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {savingsGoals.slice(0, 2).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                return (
                  <div key={goal.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-amber-200">
                    <div className="text-2xl">{goal.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-amber-900">{goal.name}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 flex-1 bg-amber-100" />
                        <span className="text-xs text-amber-600 font-medium">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {savingsGoals.length > 2 && (
              <p className="text-sm text-amber-600 text-center font-medium">
                +{savingsGoals.length - 2} objetivo{savingsGoals.length - 2 !== 1 ? 's' : ''} más
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transacciones recientes mejoradas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-slate-600" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No hay transacciones recientes</p>
              <p className="text-sm text-slate-400 mt-1">
                Usa el botón + para agregar tu primera transacción
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const category = getCategoryById(transaction.category)
                const card = cards.find(c => c.id === transaction.cardId)
                
                return (
                  <div key={transaction.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                      {category?.icon || '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-slate-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span className="font-medium">{category?.name}</span>
                        {card && (
                          <>
                            <span>•</span>
                            <span>{card.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      {transaction.grossAmount && transaction.grossAmount !== transaction.amount && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Banknote className="h-3 w-3" />
                          <span>Bruto: {formatCurrency(transaction.grossAmount, !showBalances)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className={`font-bold text-base px-3 py-1 ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, !showBalances)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarjetas por propósito - versión compacta */}
      {cards.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-600" />
              Mis Tarjetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(cardsByPurpose).map(([purpose, purposeCards]) => {
                if (purposeCards.length === 0) return null
                
                const totalBalance = purposeCards.reduce((sum, card) => sum + card.balance, 0)
                
                return (
                  <div
                    key={purpose}
                    className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{purposeIcons[purpose as keyof typeof purposeIcons]}</span>
                      <span className="font-medium text-sm text-slate-700">
                        {purposeLabels[purpose as keyof typeof purposeLabels]}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(totalBalance, !showBalances)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {purposeCards.length} tarjeta{purposeCards.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}