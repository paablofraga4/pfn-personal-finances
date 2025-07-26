import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Target, Calendar, TrendingUp, Trash2 } from 'lucide-react'
import { SavingsGoal } from '../types/finance'

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
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useFinance()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Objetivos de Ahorro</h2>
        <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
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
              
              <Button type="submit" className="w-full">
                Crear Objetivo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {savingsGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes objetivos de ahorro</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer objetivo para empezar a ahorrar de manera organizada
            </p>
            <Button onClick={() => setShowAddGoal(true)}>
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
              <Card key={goal.id} className="relative overflow-hidden">
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