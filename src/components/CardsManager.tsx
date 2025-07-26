import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Plus, CreditCard, Trash2, Edit } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'

const cardColors = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Púrpura', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Gris', value: '#6b7280' },
]

export const CardsManager = () => {
  const { cards, addCard, deleteCard } = useFinance()
  const [showAddCard, setShowAddCard] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<'credit' | 'debit'>('credit')
  const [lastFourDigits, setLastFourDigits] = useState('')
  const [color, setColor] = useState(cardColors[0].value)
  const [balance, setBalance] = useState('')
  const [limit, setLimit] = useState('')
  const [purpose, setPurpose] = useState<'gastos_corrientes' | 'dolares' | 'gastos_mensuales' | 'otros'>('otros')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !lastFourDigits || !balance) return

    setLoading(true)
    try {
      await addCard({
        name,
        type,
        lastFourDigits,
        color,
        balance: parseFloat(balance),
        limit: limit ? parseFloat(limit) : undefined,
        purpose
      })
      
      // Reset form
      setName('')
      setType('credit')
      setLastFourDigits('')
      setColor(cardColors[0].value)
      setBalance('')
      setLimit('')
      setPurpose('otros')
      setShowAddCard(false)
    } catch (error) {
      console.error('Error adding card:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCardTransactions = (cardId: string) => {
    // This would be implemented with actual transaction filtering
    return 0 // Placeholder
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mis Tarjetas</h2>
          <p className="text-muted-foreground">
            Gestiona tus tarjetas de crédito y débito
          </p>
        </div>
        <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Tarjeta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Tarjeta</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Tarjeta</Label>
                <Input
                  id="name"
                  placeholder="Ej: Tarjeta Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={(value: 'credit' | 'debit') => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="debit">Tarjeta de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Propósito</Label>
                <Select value={purpose} onValueChange={(value: 'gastos_corrientes' | 'dolares' | 'gastos_mensuales' | 'otros') => setPurpose(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gastos_corrientes">💳 Gastos Corrientes</SelectItem>
                    <SelectItem value="dolares">💵 Cuenta USD</SelectItem>
                    <SelectItem value="gastos_mensuales">🏠 Gastos Mensuales</SelectItem>
                    <SelectItem value="otros">💰 Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Four Digits */}
              <div className="space-y-2">
                <Label htmlFor="lastFour">Últimos 4 Dígitos</Label>
                <Input
                  id="lastFour"
                  placeholder="1234"
                  maxLength={4}
                  value={lastFourDigits}
                  onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cardColors.map((colorOption) => (
                      <SelectItem key={colorOption.value} value={colorOption.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: colorOption.value }}
                          />
                          {colorOption.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Balance */}
              <div className="space-y-2">
                <Label htmlFor="balance">Balance Actual</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                />
              </div>

              {/* Limit (for credit cards) */}
              {type === 'credit' && (
                <div className="space-y-2">
                  <Label htmlFor="limit">Límite de Crédito (Opcional)</Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCard(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Agregando...' : 'Agregar Tarjeta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes tarjetas registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega tus tarjetas para llevar un mejor control de tus gastos
            </p>
            <Button onClick={() => setShowAddCard(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Primera Tarjeta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden">
              {/* Card Visual */}
              <div 
                className="h-32 p-4 text-white relative"
                style={{ 
                  background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)` 
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{card.name}</h3>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {card.type === 'credit' ? 'Crédito' : 'Débito'}
                    </Badge>
                  </div>
                  <CreditCard className="h-6 w-6 opacity-80" />
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm opacity-80">**** **** ****</p>
                    <p className="text-xl font-mono">{card.lastFourDigits}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Balance</p>
                    <p className="text-lg font-bold">{formatCurrency(card.balance)}</p>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <CardContent className="p-4">
                <div className="space-y-2">
                  {(card.limit || card.limitAmount) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Límite:</span>
                      <span>{formatCurrency(card.limit || card.limitAmount || 0)}</span>
                    </div>
                  )}
                  
                  {(card.limit || card.limitAmount) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponible:</span>
                      <span className="text-accent font-medium">
                        {formatCurrency((card.limit || card.limitAmount || 0) - Math.abs(card.balance))}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transacciones:</span>
                    <span>{getCardTransactions(card.id)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La tarjeta será eliminada permanentemente.
                          Las transacciones asociadas no se eliminarán.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteCard(card.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}