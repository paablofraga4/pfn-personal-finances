import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { MessageSquare, Send, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react'
import { categories } from '../data/categories'

interface ParsedTransaction {
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  confidence: 'high' | 'medium' | 'low'
}

const getCategoryKeywords = (categoryId: string): string[] => {
  const keywordMap: { [key: string]: string[] } = {
    'food': ['comida', 'comer', 'restaurante', 'supermercado', 'mercado', 'almuerzo', 'cena', 'desayuno', 'café', 'bar'],
    'transport': ['transporte', 'taxi', 'uber', 'metro', 'autobús', 'gasolina', 'combustible', 'parking', 'aparcamiento'],
    'shopping': ['compras', 'ropa', 'tienda', 'amazon', 'online', 'zapatos', 'vestido'],
    'entertainment': ['cine', 'teatro', 'concierto', 'entretenimiento', 'juego', 'netflix', 'spotify'],
    'health': ['médico', 'farmacia', 'hospital', 'dentista', 'medicina', 'salud'],
    'education': ['educación', 'curso', 'libro', 'universidad', 'colegio', 'formación'],
    'utilities': ['luz', 'agua', 'gas', 'internet', 'teléfono', 'electricidad', 'servicios'],
    'rent': ['alquiler', 'renta', 'casa', 'piso', 'vivienda'],
    'salary': ['salario', 'sueldo', 'nómina', 'trabajo'],
    'freelance': ['freelance', 'proyecto', 'cliente', 'trabajo independiente'],
    'investment': ['inversión', 'dividendos', 'acciones', 'bolsa', 'crypto'],
    'gift': ['regalo', 'obsequio', 'donación']
  }
  
  return keywordMap[categoryId] || []
}

export const ChatLogger = () => {
  const { addTransaction } = useFinance()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null)
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'system'
    message: string
    timestamp: Date
  }>>([
    {
      type: 'system',
      message: '¡Hola! Puedes registrar tus transacciones de forma natural. Por ejemplo: "Gasté 25€ en comida en el supermercado" o "Recibí 1500€ de salario"',
      timestamp: new Date()
    }
  ])

  const parseMessage = (text: string): ParsedTransaction | null => {
    const lowerText = text.toLowerCase()
    
    // Extract amount
    const amountMatch = text.match(/(\d+(?:[.,]\d{1,2})?)\s*€?/) || text.match(/€\s*(\d+(?:[.,]\d{1,2})?)/)
    if (!amountMatch) return null
    
    const amount = parseFloat(amountMatch[1].replace(',', '.'))
    
    // Determine type based on keywords
    const incomeKeywords = ['recibí', 'cobré', 'ingreso', 'salario', 'sueldo', 'pago', 'ganancia', 'freelance', 'trabajo']
    const expenseKeywords = ['gasté', 'pagué', 'compré', 'gasto', 'cuesta', 'costó', 'perdí']
    
    let type: 'income' | 'expense' = 'expense' // default
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    
    if (incomeKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'income'
      confidence = 'high'
    } else if (expenseKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'expense'
      confidence = 'high'
    }
    
    // Try to match category
    let category = type === 'income' ? 'other-income' : 'other-expense'
    let categoryConfidence = 'low'
    
    for (const cat of categories) {
      const categoryKeywords = getCategoryKeywords(cat.id)
      if (categoryKeywords.some(keyword => lowerText.includes(keyword))) {
        category = cat.id
        categoryConfidence = 'high'
        break
      }
    }
    
    // Generate description
    let description = text
    // Remove amount and currency from description
    description = description.replace(/(\d+(?:[.,]\d{1,2})?)\s*€?/g, '').replace(/€\s*(\d+(?:[.,]\d{1,2})?)/g, '')
    // Remove common action words
    description = description.replace(/^(gasté|pagué|compré|recibí|cobré)\s*/i, '')
    description = description.trim()
    
    if (!description) {
      const cat = categories.find(c => c.id === category)
      description = `${type === 'income' ? 'Ingreso' : 'Gasto'} de ${cat?.name || 'categoría desconocida'}`
    }
    
    return {
      amount,
      description,
      category,
      type,
      confidence: categoryConfidence === 'high' && confidence === 'high' ? 'high' : 
                 categoryConfidence === 'high' || confidence === 'high' ? 'medium' : 'low'
    }
  }



  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setLoading(true)
    
    // Add user message to chat
    const userMessage = {
      type: 'user' as const,
      message: message.trim(),
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, userMessage])
    
    // Try to parse the transaction
    const parsed = parseMessage(message.trim())
    
    if (parsed) {
      setParsedTransaction(parsed)
      const systemMessage = {
        type: 'system' as const,
        message: `He detectado una transacción. ¿Es correcta la información?`,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, systemMessage])
    } else {
      const systemMessage = {
        type: 'system' as const,
        message: 'No pude detectar una transacción válida. Intenta con algo como "Gasté 25€ en comida" o "Recibí 1500€ de salario".',
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, systemMessage])
    }
    
    setMessage('')
    setLoading(false)
  }

  const handleConfirmTransaction = async () => {
    if (!parsedTransaction) return
    
    setLoading(true)
    try {
      await addTransaction({
        amount: parsedTransaction.amount,
        description: parsedTransaction.description,
        category: parsedTransaction.category,
        type: parsedTransaction.type,
        date: new Date().toISOString()
      })
      
      const systemMessage = {
        type: 'system' as const,
        message: '¡Transacción registrada correctamente! ¿Hay algo más que quieras agregar?',
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, systemMessage])
      setParsedTransaction(null)
    } catch (error) {
      const systemMessage = {
        type: 'system' as const,
        message: 'Hubo un error al registrar la transacción. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, systemMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleRejectTransaction = () => {
    setParsedTransaction(null)
    const systemMessage = {
      type: 'system' as const,
      message: 'Entendido. Puedes intentar describir la transacción de otra manera o agregar más detalles.',
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, systemMessage])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Desconocido'
  }

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Chat Financiero</h2>
        <p className="text-muted-foreground">
          Registra tus transacciones de forma natural usando lenguaje cotidiano
        </p>
      </div>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Ejemplos de uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Gastos:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• "Gasté 25€ en comida en el supermercado"</li>
                <li>• "Pagué 50€ de gasolina"</li>
                <li>• "Compré ropa por 80€"</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Ingresos:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• "Recibí 1500€ de salario"</li>
                <li>• "Cobré 300€ por un proyecto freelance"</li>
                <li>• "Ingreso de 100€ por dividendos"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chat History */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  chat.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p>{chat.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {chat.timestamp.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Parsed Transaction Preview */}
          {parsedTransaction && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Transacción detectada
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <Badge variant={parsedTransaction.type === 'income' ? 'default' : 'destructive'}>
                    {parsedTransaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cantidad:</span>
                  <span className="font-medium">{formatCurrency(parsedTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descripción:</span>
                  <span>{parsedTransaction.description}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categoría:</span>
                  <span>{getCategoryName(parsedTransaction.category)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confianza:</span>
                  <span className={getConfidenceColor(parsedTransaction.confidence)}>
                    {parsedTransaction.confidence === 'high' ? 'Alta' : 
                     parsedTransaction.confidence === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleConfirmTransaction} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirmar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRejectTransaction}
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Corregir
                </Button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Escribe tu transacción aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !message.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}