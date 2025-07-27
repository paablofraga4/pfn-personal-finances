import { useState, useRef, useCallback } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  CheckCircle, 
  X, 
  Sparkles,
  Euro,
  TrendingUp,
  TrendingDown,
  Loader2,
  CreditCard
} from 'lucide-react'
import { categories } from '../data/categories'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'

interface ParsedTransaction {
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  confidence: 'high' | 'medium' | 'low'
  date?: Date
  cardId?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'transaction'
  content: string
  timestamp: Date
  transaction?: ParsedTransaction
}

const getCategoryKeywords = (categoryId: string): string[] => {
  const keywordMap: { [key: string]: string[] } = {
    'food': ['comida', 'comer', 'restaurante', 'supermercado', 'mercado', 'almuerzo', 'cena', 'desayuno', 'café', 'bar', 'pizza', 'hamburguesa'],
    'transport': ['transporte', 'taxi', 'uber', 'metro', 'autobús', 'gasolina', 'combustible', 'parking', 'aparcamiento', 'tren', 'avión'],
    'shopping': ['compras', 'ropa', 'tienda', 'amazon', 'online', 'zapatos', 'vestido', 'compré', 'comprar'],
    'entertainment': ['cine', 'teatro', 'concierto', 'entretenimiento', 'juego', 'netflix', 'spotify', 'fiesta', 'bar'],
    'health': ['médico', 'farmacia', 'hospital', 'dentista', 'medicina', 'salud', 'doctor'],
    'education': ['educación', 'curso', 'libro', 'universidad', 'colegio', 'formación', 'estudio'],
    'utilities': ['luz', 'agua', 'gas', 'internet', 'teléfono', 'electricidad', 'servicios', 'wifi'],
    'rent': ['alquiler', 'renta', 'casa', 'piso', 'vivienda', 'hipoteca'],
    'salary': ['salario', 'sueldo', 'nómina', 'trabajo', 'paga'],
    'freelance': ['freelance', 'proyecto', 'cliente', 'trabajo independiente', 'consultoría'],
    'investment': ['inversión', 'dividendos', 'acciones', 'bolsa', 'crypto', 'bitcoin'],
    'gift': ['regalo', 'obsequio', 'donación', 'propina']
  }
  
  return keywordMap[categoryId] || []
}

export const ModernChatLogger = () => {
  const { addTransaction, cards } = useFinance()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! 👋 Soy tu asistente financiero. Puedes decirme o escribirme tus gastos e ingresos de forma natural.',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'assistant',
      content: '💡 Ejemplos: "Gasté 25€ en comida el 15 de julio", "Recibí 1500€ de salario ayer", "Pagué 50€ de gasolina hace 2 días".',
      timestamp: new Date()
    }
  ])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Desconocido'
  }

  const parseDate = (text: string): Date | null => {
    const lowerText = text.toLowerCase()
    const today = new Date()
    const currentYear = today.getFullYear()
    
    // Meses en español
    const months = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    }
    
    // Patrones de fecha
    const datePatterns = [
      // "el 15 de julio", "15 de julio"
      /(?:el\s+)?(\d{1,2})\s+de\s+(\w+)/,
      // "15/07", "15-07"
      /(\d{1,2})[-/](\d{1,2})/,
      // "julio 15", "15 julio"
      /(\w+)\s+(\d{1,2})|(\d{1,2})\s+(\w+)/,
      // "ayer", "anteayer"
      /(ayer|anteayer|antier)/,
      // "hace 2 días", "hace una semana"
      /hace\s+(\d+|una?)\s+(día|días|semana|semanas)/
    ]
    
    for (const pattern of datePatterns) {
      const match = lowerText.match(pattern)
      if (match) {
        // "el 15 de julio" o "15 de julio"
        if (match[1] && match[2] && isNaN(Number(match[2]))) {
          const day = parseInt(match[1])
          const monthName = match[2].toLowerCase()
          const monthIndex = months[monthName as keyof typeof months]
          
          if (monthIndex !== undefined && day >= 1 && day <= 31) {
            const date = new Date(currentYear, monthIndex, day)
            // Si la fecha es futura, usar el año anterior
            if (date > today) {
              date.setFullYear(currentYear - 1)
            }
            return date
          }
        }
        
        // "15/07" o "15-07"
        if (match[1] && match[2] && !isNaN(Number(match[2]))) {
          const day = parseInt(match[1])
          const month = parseInt(match[2]) - 1 // Los meses empiezan en 0
          
          if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            const date = new Date(currentYear, month, day)
            // Si la fecha es futura, usar el año anterior
            if (date > today) {
              date.setFullYear(currentYear - 1)
            }
            return date
          }
        }
        
        // "julio 15" o "15 julio"
        if ((match[1] && match[2]) || (match[3] && match[4])) {
          let day: number, monthName: string
          
          if (match[1] && match[2]) {
            // "julio 15"
            monthName = match[1].toLowerCase()
            day = parseInt(match[2])
          } else {
            // "15 julio"
            day = parseInt(match[3])
            monthName = match[4].toLowerCase()
          }
          
          const monthIndex = months[monthName as keyof typeof months]
          
          if (monthIndex !== undefined && day >= 1 && day <= 31) {
            const date = new Date(currentYear, monthIndex, day)
            // Si la fecha es futura, usar el año anterior
            if (date > today) {
              date.setFullYear(currentYear - 1)
            }
            return date
          }
        }
        
        // "ayer", "anteayer"
        if (match[1]) {
          const keyword = match[1]
          const date = new Date(today)
          
          if (keyword === 'ayer') {
            date.setDate(today.getDate() - 1)
            return date
          } else if (keyword === 'anteayer' || keyword === 'antier') {
            date.setDate(today.getDate() - 2)
            return date
          }
        }
        
        // "hace X días/semanas"
        if (match[1] && match[2]) {
          const amount = match[1] === 'una' || match[1] === 'un' ? 1 : parseInt(match[1])
          const unit = match[2]
          const date = new Date(today)
          
          if (unit.includes('día')) {
            date.setDate(today.getDate() - amount)
            return date
          } else if (unit.includes('semana')) {
            date.setDate(today.getDate() - (amount * 7))
            return date
          }
        }
      }
    }
    
    return null
  }

  const parseMessage = useCallback((text: string): ParsedTransaction | null => {
    const lowerText = text.toLowerCase()
    
    // Extract amount - more flexible patterns
    const amountPatterns = [
      /(\d+(?:[.,]\d{1,2})?)\s*€/,
      /€\s*(\d+(?:[.,]\d{1,2})?)/,
      /(\d+(?:[.,]\d{1,2})?)\s*euros?/,
      /euros?\s*(\d+(?:[.,]\d{1,2})?)/,
      /(\d+(?:[.,]\d{1,2})?)\s*pesos?/,
      /(\d+(?:[.,]\d{1,2})?)\s*dólares?/,
      /(\d+(?:[.,]\d{1,2})?)/  // Just numbers as fallback
    ]
    
    let amountMatch = null
    for (const pattern of amountPatterns) {
      amountMatch = text.match(pattern)
      if (amountMatch) break
    }
    
    if (!amountMatch) return null
    
    const amount = parseFloat(amountMatch[1].replace(',', '.'))
    
    // Determine type with more keywords
    const incomeKeywords = [
      'recibí', 'cobré', 'ingreso', 'salario', 'sueldo', 'pago', 'ganancia', 
      'freelance', 'trabajo', 'me pagaron', 'entrada', 'ingresé', 'gané',
      'dividendos', 'bonus', 'propina', 'venta'
    ]
    const expenseKeywords = [
      'gasté', 'pagué', 'compré', 'gasto', 'cuesta', 'costó', 'perdí',
      'me costó', 'invertí', 'doné', 'regalé', 'salió', 'desembolsé'
    ]
    
    let type: 'income' | 'expense' = 'expense'
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    
    if (incomeKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'income'
      confidence = 'high'
    } else if (expenseKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'expense'
      confidence = 'high'
    }
    
    // Smart category detection
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
    
    // Parse date
    const parsedDate = parseDate(text)
    const transactionDate = parsedDate || new Date() // Use today if no date found
    
    // Generate clean description
    let description = text
    // Remove amount and currency
    for (const pattern of amountPatterns) {
      description = description.replace(pattern, '')
    }
    // Remove date patterns
    const dateCleanPatterns = [
      /(?:el\s+)?\d{1,2}\s+de\s+\w+/gi,
      /\d{1,2}[-/]\d{1,2}/gi,
      /\w+\s+\d{1,2}|\d{1,2}\s+\w+/gi,
      /(ayer|anteayer|antier)/gi,
      /hace\s+(\d+|una?)\s+(día|días|semana|semanas)/gi
    ]
    
    for (const pattern of dateCleanPatterns) {
      description = description.replace(pattern, '')
    }
    
    // Remove common action words
    description = description.replace(/^(gasté|pagué|compré|recibí|cobré|me pagaron|ingresé|gané)\s*/i, '')
    description = description.replace(/\s+(en|de|por|para)\s+/gi, ' ')
    description = description.trim()
    
    if (!description || description.length < 3) {
      const cat = categories.find(c => c.id === category)
      description = `${type === 'income' ? 'Ingreso' : 'Gasto'} de ${cat?.name || 'categoría desconocida'}`
    }
    
    return {
      amount,
      description,
      category,
      type,
      confidence: categoryConfidence === 'high' && confidence === 'high' ? 'high' : 
                 categoryConfidence === 'high' || confidence === 'high' ? 'medium' : 'low',
      date: transactionDate
    }
  }, [])

  const processTextMessage = async (text: string) => {
    const parsed = parseMessage(text)
    
    if (parsed) {
      const transactionMessage: ChatMessage = {
        id: Date.now().toString() + '_transaction',
        type: 'transaction',
        content: 'Transacción detectada',
        timestamp: new Date(),
        transaction: parsed
      }
      
      setMessages(prev => [...prev, transactionMessage])
    } else {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: '🤔 No pude detectar una transacción válida. Intenta con algo como "Gasté 25€ en comida" o "Recibí 1500€ de salario".',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    
    try {
      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64Data = dataUrl.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(audioBlob)
      })

      // Transcribe using Blink SDK
      const { text } = await blink.ai.transcribeAudio({
        audio: base64Audio,
        language: 'es'
      })

      if (text.trim()) {
        // Add transcribed message
        const transcribedMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: `🎤 "${text}"`,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, transcribedMessage])
        
        // Process the transcribed text
        await processTextMessage(text)
      } else {
        toast.error('No se pudo transcribir el audio')
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      toast.error('Error al procesar el audio')
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('🎤 Grabando... Habla ahora')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('No se pudo acceder al micrófono')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    
    await processTextMessage(message.trim())
  }

  const handleConfirmTransaction = async (messageId: string, transaction: ParsedTransaction) => {
    try {
      console.log('🔄 Intentando agregar transacción:', transaction)
      
      const transactionData = {
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        type: transaction.type,
        date: (transaction.date || new Date()).toISOString(),
        grossAmount: transaction.type === 'income' ? transaction.amount * 1.21 : undefined,
        cardId: transaction.cardId
      }
      
      console.log('📝 Datos de transacción a enviar:', transactionData)
      
      try {
        const result = await addTransaction(transactionData)
        console.log('✅ Transacción agregada exitosamente:', result)
      } catch (error) {
        console.error('❌ Error en addTransaction:', error)
        throw error
      }
      
      // Remove transaction message and add success message
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ ¡Perfecto! He registrado tu ${transaction.type === 'income' ? 'ingreso' : 'gasto'} de ${formatCurrency(transaction.amount)}. ¿Algo más?`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, successMessage])
      toast.success('Transacción registrada correctamente')
    } catch (error) {
      console.error('❌ Error adding transaction:', error)
      toast.error('Error al registrar la transacción: ' + (error as Error).message)
    }
  }

  const handleRejectTransaction = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
    
    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: '👍 Entendido. Puedes intentar describir la transacción de otra manera.',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])
  }

  const handleCardSelection = (messageId: string, cardId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.transaction) {
        return {
          ...msg,
          transaction: {
            ...msg.transaction,
            cardId: cardId || undefined
          }
        }
      }
      return msg
    }))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Asistente Financiero</h2>
            <p className="text-sm text-muted-foreground">
              Habla o escribe tus transacciones naturalmente
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'transaction' && msg.transaction ? (
              // Transaction confirmation card
              <Card className="max-w-sm border-2 border-dashed border-primary/50 bg-primary/5 shadow-glow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {msg.transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">
                      {msg.transaction.type === 'income' ? 'Ingreso detectado' : 'Gasto detectado'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cantidad:</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(msg.transaction.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descripción:</span>
                      <span className="text-right max-w-32 truncate">
                        {msg.transaction.description}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoría:</span>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(msg.transaction.category)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="text-sm font-medium">
                        {msg.transaction.date?.toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: msg.transaction.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Card Selection */}
                  {cards.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-xs font-medium flex items-center gap-1 mb-2">
                        <CreditCard className="h-3 w-3" />
                        Tarjeta (Opcional)
                      </Label>
                      <Select 
                        value={msg.transaction.cardId || ''} 
                        onValueChange={(value) => handleCardSelection(msg.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecciona una tarjeta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            <div className="flex items-center gap-2">
                              <span>💳</span>
                              <span>Sin tarjeta</span>
                            </div>
                          </SelectItem>
                          {cards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: card.color }}
                                />
                                <span>{card.name}</span>
                                <span className="text-muted-foreground">(**** {card.lastFourDigits})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleConfirmTransaction(msg.id, msg.transaction!)}
                      className="flex-1 h-8 gradient-primary text-white shadow-glow"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirmar
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectTransaction(msg.id)}
                      className="h-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Regular message
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-glow' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-2xl flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Procesando audio...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Escribe tu transacción..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isRecording || isProcessing}
              className="pr-12"
            />
            <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={isRecording ? "animate-pulse" : ""}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || isRecording || isProcessing}
            className="gradient-primary text-white shadow-glow"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {isRecording && (
          <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
            🎤 Grabando... Toca el micrófono para parar
          </p>
        )}
      </div>
    </div>
  )
}