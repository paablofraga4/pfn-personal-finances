import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Plus, Minus, Euro, Calculator } from 'lucide-react'
import { categories } from '../data/categories'

export const FloatingAddButton = () => {
  const { addTransaction, cards } = useFinance()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [grossAmount, setGrossAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('')
  const [cardId, setCardId] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGross, setShowGross] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !category) return

    setLoading(true)
    try {
      await addTransaction({
        amount: parseFloat(amount),
        grossAmount: grossAmount ? parseFloat(grossAmount) : undefined,
        description,
        category,
        type,
        cardId: cardId || undefined,
        date: new Date().toISOString()
      })
      
      // Reset form
      setAmount('')
      setGrossAmount('')
      setDescription('')
      setCategory('')
      setCardId('')
      setOpen(false)
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

  const calculateNetFromGross = () => {
    if (grossAmount) {
      // Asumiendo 21% de impuestos (ajustable)
      const taxRate = 0.21
      const netAmount = parseFloat(grossAmount) * (1 - taxRate)
      setAmount(netAmount.toFixed(2))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Nueva Transacción
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de transacción */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => {
                  setType('expense')
                  setShowGross(false)
                  setGrossAmount('')
                }}
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

            {/* Mostrar opción de bruto/neto solo para ingresos */}
            {type === 'income' && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGross(!showGross)}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {showGross ? 'Solo Neto' : 'Bruto/Neto'}
                </Button>
                {showGross && (
                  <Badge variant="secondary" className="text-xs">
                    Se calculará el neto automáticamente
                  </Badge>
                )}
              </div>
            )}

            {/* Campos de cantidad */}
            {showGross && type === 'income' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Cantidad bruta (€)"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="pl-10"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Cantidad neta (€)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10"
                      step="0.01"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={calculateNetFromGross}
                    disabled={!grossAmount}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Se asume 21% de impuestos. El neto es lo que realmente recibes.
                </p>
              </div>
            ) : (
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={type === 'income' ? 'Cantidad neta (€)' : 'Cantidad (€)'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  step="0.01"
                  required
                />
              </div>
            )}

            {/* Descripción */}
            <Input
              placeholder="¿En qué gastaste/ganaste?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            {/* Categoría */}
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
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

            {/* Tarjeta */}
            {cards.length > 0 && (
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una tarjeta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin tarjeta</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                        {card.name} ****{card.lastFourDigits}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}