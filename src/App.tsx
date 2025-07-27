import { useState } from 'react'
import { useFinance } from './hooks/useFinance'
import { ImprovedDashboard } from './components/ImprovedDashboard'
import { TransactionsList } from './components/TransactionsList'
import { CardsManager } from './components/CardsManager'
import { Reports } from './components/Reports'
import { SavingsGoals } from './components/SavingsGoals'
import { MonthlyExpenses } from './components/MonthlyExpenses'
import { ModernChatLogger } from './components/ModernChatLogger'
import { FloatingAddButton } from './components/FloatingAddButton'
import { FloatingChatButton } from './components/FloatingChatButton'
import { Login } from './components/Login'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card } from './components/ui/card'
import { Wallet, BarChart3, CreditCard, MessageSquare, Home, Target, Calendar } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, loading } = useFinance()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tu hub financiero...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Hub Financiero
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user.email}
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2">
              <Home className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Inicio</span>
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex items-center gap-1 sm:gap-2">
              <Target className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Ahorros</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1 sm:gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Mensuales</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-1 sm:gap-2">
              <Wallet className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-1 sm:gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Tarjetas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ImprovedDashboard />
          </TabsContent>

          <TabsContent value="savings" className="space-y-6">
            <SavingsGoals />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <MonthlyExpenses />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsList />
          </TabsContent>

          <TabsContent value="cards" className="space-y-6">
            <CardsManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Reports />
          </TabsContent>

          <TabsContent value="chat" className="h-[calc(100vh-12rem)]">
            <Card className="h-full">
              <ModernChatLogger />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Botones flotantes */}
      <FloatingAddButton />
      <FloatingChatButton />
      
      <Toaster position="bottom-center" />
    </div>
  )
}

export default App