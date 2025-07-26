import { useFinance } from '../hooks/useFinance'
import { Card, CardContent } from './ui/card'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useMemo } from 'react'

export const BalanceChart = () => {
  const { transactions } = useFinance()

  const chartData = useMemo(() => {
    // Obtener los últimos 30 días
    const days = 30
    const data = []
    const today = new Date()
    
    let runningBalance = 0
    
    // Calcular balance acumulativo para los últimos 30 días
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate.toDateString() === date.toDateString()
      })
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      runningBalance += dayIncome - dayExpenses
      
      data.push({
        date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        balance: runningBalance,
        income: dayIncome,
        expenses: dayExpenses
      })
    }
    
    return data
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Ingresos: {formatCurrency(data.income)}
            </p>
            <p className="text-red-600">
              Gastos: {formatCurrency(data.expenses)}
            </p>
            <p className="font-semibold border-t pt-1">
              Balance: {formatCurrency(data.balance)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(262 83% 58%)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(262 83% 58%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>Últimos 30 días</span>
          <span>Evolución del balance</span>
        </div>
      </CardContent>
    </Card>
  )
}