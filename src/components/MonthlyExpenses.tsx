import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Plus, Calendar, CreditCard, Trash2, Edit, AlertCircle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { categories, getExpenseCategories } from '../data/categories'

export const MonthlyExpenses = () => {
  const { monthlyExpenses, cards, addMonthlyExpense, updateMonthlyExpense, deleteMonthlyExpense, getCurrentMonthExpenses } = useFinance()
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [cardId, setCardId] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount || !category || !dayOfMonth) return

    setLoading(true)
    try {
      await addMonthlyExpense({
        name,
        amount: parseFloat(amount),
        category,
        cardId: cardId || undefined,
        dayOfMonth: parseInt(dayOfMonth),
        isActive,
        description: description || undefined
      })
      
      // Reset form
      setName('')
      setAmount('')
      setCategory('')
      setCardId('')
      setDayOfMonth('')
      setDescription('')
      setIsActive(true)
      setShowAddExpense(false)
    } catch (error) {
      console.error('Error adding monthly expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateMonthlyExpense(id, { isActive: !currentActive })
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Desconocido'
  }

  const getCardName = (cardId: string) => {
    return cards.find(c => c.id === cardId)?.name || 'Sin tarjeta'
  }

  const currentMonthTotal = getCurrentMonthExpenses()
  const activeExpenses = monthlyExpenses.filter(expense => expense.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gastos Mensuales</h2>
          <p className="text-muted-foreground">
            Gestiona tus gastos recurrentes mensuales
          </p>
        </div>
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 gradient-primary text-white shadow-glow">
              <Plus className="h-4 w-4" />
              Agregar Gasto Mensual
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Agregar Gasto Mensual</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nombre del Gasto</Label>
                <Input
                  id="name"
                  placeholder="Ej: Alquiler, Netflix, Gimnasio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Cantidad Mensual</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="h-12 text-lg font-medium pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Categoría</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {getExpenseCategories().map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Card Selection */}
              <div className="space-y-2">
                <Label htmlFor="card" className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarjeta (Opcional)
                </Label>
                <Select value={cardId} onValueChange={setCardId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona una tarjeta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💳</span>
                        <span>Sin tarjeta</span>
                      </div>
                    </SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: card.color }}
                          />
                          <span className="font-medium">{card.name}</span>
                          <span className="text-muted-foreground">(**** {card.lastFourDigits})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day of Month */}
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Día del Mes
                </Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Descripción (Opcional)</Label>
                <Input
                  id="description"
                  placeholder="Notas adicionales..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="text-sm font-medium">Activo</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddExpense(false)}
                  className="h-12 px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-12 px-8 gradient-primary text-white shadow-glow"
                >
                  {loading ? 'Agregando...' : 'Agregar Gasto Mensual'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="gradient-card shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen del Mes Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Gastos Mensuales</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(currentMonthTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Gastos Activos</p>
              <p className="text-2xl font-bold">{activeExpenses.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Promedio por Gasto</p>
              <p className="text-2xl font-bold">
                {activeExpenses.length > 0 
                  ? formatCurrency(currentMonthTotal / activeExpenses.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {monthlyExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes gastos mensuales</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega tus gastos recurrentes para tener un mejor control de tus finanzas
            </p>
            <Button onClick={() => setShowAddExpense(true)} className="flex items-center gap-2 gradient-primary text-white shadow-glow">
              <Plus className="h-4 w-4" />
              Agregar Primer Gasto Mensual
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {monthlyExpenses.map((expense) => (
            <Card key={expense.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {categories.find(c => c.id === expense.category)?.icon || '💰'}
                    </div>
                    <div>
                      <h3 className="font-medium">{expense.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(expense.category)}
                        </Badge>
                        {expense.cardId && (
                          <Badge variant="outline" className="text-xs">
                            {getCardName(expense.cardId)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                    <p className="text-sm text-muted-foreground">Día {expense.dayOfMonth}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={expense.isActive}
                      onCheckedChange={() => handleToggleActive(expense.id, expense.isActive)}
                    />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar gasto mensual?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El gasto mensual será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMonthlyExpense(expense.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
              
              {!expense.isActive && (
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                  <Badge variant="secondary" className="text-xs">
                    Inactivo
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 