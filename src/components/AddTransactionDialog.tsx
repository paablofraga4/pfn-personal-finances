import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { categories, getExpenseCategories, getIncomeCategories } from '../data/categories'
import { ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react'

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AddTransactionDialog = ({ open, onOpenChange }: AddTransactionDialogProps) => {
  const { addTransaction, cards } = useFinance()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [cardId, setCardId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !category) return

    setLoading(true)
    try {
      await addTransaction({
        amount: parseFloat(amount),
        description,
        category,
        type,
        cardId: cardId || undefined,
        date: new Date(date).toISOString()
      })
      
      // Reset form
      setAmount('')
      setDescription('')
      setCategory('')
      setCardId('')
      setDate(new Date().toISOString().split('T')[0])
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableCategories = type === 'income' ? getIncomeCategories() : getExpenseCategories()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Agregar Transacción</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => {
                setType('expense')
                setCategory('')
              }}
              className={`flex items-center gap-2 h-12 ${
                type === 'expense' 
                  ? 'gradient-primary text-white shadow-glow' 
                  : 'hover:shadow-md transition-shadow'
              }`}
            >
              <ArrowDownRight className="h-5 w-5" />
              <span className="font-medium">Gasto</span>
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => {
                setType('income')
                setCategory('')
              }}
              className={`flex items-center gap-2 h-12 ${
                type === 'income' 
                  ? 'gradient-accent text-white shadow-glow-accent' 
                  : 'hover:shadow-md transition-shadow'
              }`}
            >
              <ArrowUpRight className="h-5 w-5" />
              <span className="font-medium">Ingreso</span>
            </Button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Cantidad</Label>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe la transacción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Categoría</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
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

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-12"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-12 px-8 gradient-primary text-white shadow-glow"
            >
              {loading ? 'Agregando...' : 'Agregar Transacción'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}