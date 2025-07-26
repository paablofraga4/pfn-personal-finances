import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { QuickAddTransaction } from './QuickAddTransaction'
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
  EyeOff
} from 'lucide-react'
import { useState } from 'react'
import { getCategoryById } from '../data/categories'

export const NewDashboard = () => {
  const { transactions, cards, savingsGoals, getStats } = useFinance()
  const [showBalances, setShowBalances] = useState(true)
  
  const stats = getStats('monthly')
  const recentTransactions = transactions.slice(0, 3)

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

  return (
    <div className="space-y-6 pb-6">
      {/* Header con balance principal */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Balance Total</p>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {formatCurrency(stats.balance, !showBalances)}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalances(!showBalances)}
                  className="text-white hover:bg-white/20"
                >
                  {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Tasa de Ahorro</p>
              <p className="text-xl font-semibold">
                {stats.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="h-4 w-4 text-green-300" />
                <span className="text-sm text-blue-100">Ingresos</span>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.monthlyIncome, !showBalances)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="h-4 w-4 text-red-300" />
                <span className="text-sm text-blue-100">Gastos</span>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.monthlyExpenses, !showBalances)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agregar transacción rápida */}
      <QuickAddTransaction />

      {/* Objetivos de ahorro - resumen */}
      {savingsGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Objetivos de Ahorro
              </CardTitle>
              <Badge variant="outline">
                {savingsGoals.length} objetivo{savingsGoals.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progreso General</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(totalGoalsCurrent)} / {formatCurrency(totalGoalsTarget)}
                </span>
              </div>
              <Progress value={goalsProgress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {savingsGoals.slice(0, 2).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                return (
                  <div key={goal.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-xl">{goal.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.name}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {savingsGoals.length > 2 && (
              <p className="text-sm text-muted-foreground text-center">
                +{savingsGoals.length - 2} objetivo{savingsGoals.length - 2 !== 1 ? 's' : ''} más
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tarjetas por propósito */}
      {cards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mis Tarjetas
          </h3>
          
          {Object.entries(cardsByPurpose).map(([purpose, purposeCards]) => {
            if (purposeCards.length === 0) return null
            
            return (
              <Card key={purpose}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">{purposeIcons[purpose as keyof typeof purposeIcons]}</span>
                    {purposeLabels[purpose as keyof typeof purposeLabels]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {purposeCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        style={{ 
                          backgroundColor: card.color + '10',
                          borderColor: card.color + '30'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: card.color }}
                          />
                          <div>
                            <p className="font-medium">{card.name}</p>
                            <p className="text-sm text-muted-foreground">
                              **** {card.lastFourDigits}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(card.balance, !showBalances)}
                          </p>
                          {card.limitAmount && (
                            <p className="text-xs text-muted-foreground">
                              Límite: {formatCurrency(card.limitAmount, !showBalances)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Transacciones recientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay transacciones recientes</p>
              <p className="text-sm text-muted-foreground">
                Agrega tu primera transacción arriba
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const category = getCategoryById(transaction.category)
                const card = cards.find(c => c.id === transaction.cardId)
                
                return (
                  <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="text-2xl">
                      {category?.icon || '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{category?.name}</span>
                        {card && (
                          <>
                            <span>•</span>
                            <span>{card.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className="font-semibold"
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

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <PiggyBank className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Ahorros Totales</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(stats.totalSavings, !showBalances)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Esta Semana</p>
            <p className="text-xl font-bold">
              {formatCurrency(stats.weeklyExpenses, !showBalances)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}