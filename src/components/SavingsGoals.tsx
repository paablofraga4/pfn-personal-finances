import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Plus, Target, Calendar, TrendingUp, Trash2, AlertCircle, Lightbulb, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'
import { SavingsGoal } from '../types/finance'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const savingsCategories = [
  { id: 'emergency', name: 'Fondo de Emergencia', icon: '🚨', color: '#ef4444' },
  { id: 'vacation', name: 'Vacaciones', icon: '🏖️', color: '#3b82f6' },
  { id: 'house', name: 'Casa/Departamento', icon: '🏠', color: '#10b981' },
  { id: 'car', name: 'Auto', icon: '🚗', color: '#f59e0b' },
  { id: 'education', name: 'Educación', icon: '🎓', color: '#8b5cf6' },
  { id: 'investment', name: 'Inversión', icon: '📈', color: '#06b6d4' },
  { id: 'gadget', name: 'Tecnología', icon: '📱', color: '#84cc16' },
  { id: 'other', name: 'Otro', icon: '🎯', color: '#6b7280' },
]

export const SavingsGoals = () => {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, getSavingsAssistant } = useFinance()
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    category: '',
    icon: '🎯',
    color: '#3b82f6'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate || !newGoal.category) return

    const selectedCategory = savingsCategories.find(cat => cat.id === newGoal.category)
    
    try {
      await addSavingsGoal({
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        icon: selectedCategory?.icon || '🎯',
        color: selectedCategory?.color || '#3b82f6'
      })
      
      setNewGoal({
        name: '',
        targetAmount: '',
        targetDate: '',
        category: '',
        icon: '🎯',
        color: '#3b82f6'
      })
      setShowAddGoal(false)
    } catch (error) {
      console.error('Error adding goal:', error)
    }
  }

  const handleAddMoney = async (goalId: string, amount: number) => {
    const goal = savingsGoals.find(g => g.id === goalId)
    if (!goal) return

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount)
    await updateSavingsGoal(goalId, { currentAmount: newAmount })
  }

  // Obtener datos del asistente de ahorro
  const assistant = getSavingsAssistant()

  // Generar datos para las gráficas
  const generateSavingsProjection = () => {
    const months = 12
    const data = []
    let currentSavings = assistant.currentSavings
    
    for (let i = 0; i <= months; i++) {
      const projectedSavings = currentSavings + (assistant.projectedSavings * i)
      data.push({
        month: i === 0 ? 'Actual' : `Mes ${i}`,
        ahorro: projectedSavings,
        meta: assistant.monthlyGoal * i
      })
    }
    
    return data
  }

  const projectionData = generateSavingsProjection()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Asistente de Ahorro</h2>
        <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 gradient-primary text-white shadow-glow">
              <Plus className="h-4 w-4" />
              Nuevo Objetivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Objetivo de Ahorro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del objetivo</Label>
                <Input
                  id="name"
                  placeholder="Ej: Vacaciones en Europa"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Cantidad objetivo</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="date">Fecha objetivo</Label>
                <Input
                  id="date"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {savingsCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full gradient-primary text-white shadow-glow">
                Crear Objetivo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asistente de Ahorro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen Financiero */}
        <Card className="gradient-card shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Resumen de Ahorro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ahorro Actual</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(assistant.currentSavings)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Proyección Mensual</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(assistant.projectedSavings)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Presupuesto Diario</span>
                <span className="font-medium">{formatCurrency(assistant.dailyBudget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Límite de Gastos</span>
                <span className="font-medium">{formatCurrency(assistant.spendingLimit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas y Recomendaciones */}
        <Card className="gradient-card shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assistant.alerts.length > 0 && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {assistant.alerts[0]}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              {assistant.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-accent">💡</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Proyección */}
      <Card className="gradient-card shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Proyección de Ahorro (12 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ahorro" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="Ahorro Proyectado"
                />
                <Area 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  name="Meta Mensual"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Objetivos de Ahorro */}
      {savingsGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes objetivos de ahorro</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer objetivo para empezar a ahorrar de manera organizada
            </p>
            <Button onClick={() => setShowAddGoal(true)} className="gradient-primary text-white shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Objetivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savingsGoals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const daysRemaining = getDaysRemaining(goal.targetDate)
            const isCompleted = progress >= 100
            const isOverdue = daysRemaining < 0 && !isCompleted

            return (
              <Card key={goal.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: goal.color }}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{goal.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(goal.targetDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className={isOverdue ? 'text-destructive' : 'text-muted-foreground'}>
                        {daysRemaining > 0 
                          ? `${daysRemaining} días restantes`
                          : daysRemaining === 0 
                          ? 'Hoy es el día'
                          : `${Math.abs(daysRemaining)} días de retraso`
                        }
                      </span>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">¡Completado!</span>
                      </div>
                    )}
                  </div>
                  
                  {!isCompleted && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddMoney(goal.id, 10)}
                        className="flex-1"
                      >
                        +10€
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddMoney(goal.id, 50)}
                        className="flex-1"
                      >
                        +50€
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddMoney(goal.id, 100)}
                        className="flex-1"
                      >
                        +100€
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}