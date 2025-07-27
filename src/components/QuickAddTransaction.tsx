import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import { Plus, Minus, Euro } from 'lucide-react'
import { categories } from '../data/categories'

export const QuickAddTransaction = () => {
  const { addTransaction, cards } = useFinance()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('')
  const [cardId, setCardId] = useState('')
  const [loading, setLoading] = useState(false)

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
        date: new Date().toISOString()
      })
      
      // Reset form
      setAmount('')
      setDescription('')
      setCategory('')
      setCardId('')
    } catch (error) {
      console.error('Error adding transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(cat => {
    if (type === 'income') {
      return ['salary', 'freelance', 'investment', 'gift', 'other-income'].includes(cat.id)
    } else {
      return !['salary', 'freelance', 'investment', 'gift', 'other-income'].includes(cat.id)
    }
  })

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de transacción */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => setType('expense')}
              className="flex-1 flex items-center gap-2"
            >
              <Minus className="h-4 w-4" />
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => setType('income')}
              className="flex-1 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ingreso
            </Button>
          </div>

          {/* Cantidad y descripción en una fila */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                step="0.01"
                required
              />
            </div>
            <Input
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-2"
              required
            />
          </div>

          {/* Categoría y tarjeta */}
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {cards.length > 0 && (
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tarjeta</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} ****{card.lastFourDigits}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Agregando...' : 'Agregar Transacción'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}