import { useState } from 'react'
import { Home, Target, Calendar, Wallet, CreditCard, BarChart3, MessageSquare, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onAddClick: () => void
}

const navigationItems = [
  { id: 'dashboard', icon: Home, label: 'Inicio' },
  { id: 'savings', icon: Target, label: 'Ahorros' },
  { id: 'monthly', icon: Calendar, label: 'Mensuales' },
  { id: 'transactions', icon: Wallet, label: 'Historial' },
  { id: 'cards', icon: CreditCard, label: 'Tarjetas' },
  { id: 'reports', icon: BarChart3, label: 'Reportes' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
]

export const MobileNavigation = ({ activeTab, onTabChange, onAddClick }: MobileNavigationProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Navigation Items */}
            <div className="flex items-center space-x-1 flex-1 overflow-x-auto scrollbar-hide">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-all duration-200 relative",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
                    <span className="text-xs font-medium">{item.label}</span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                        layoutId="activeIndicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Add Button */}
            <motion.div className="ml-2">
              <Button
                onClick={onAddClick}
                size="sm"
                className="h-12 w-12 rounded-full gradient-primary text-white shadow-glow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="h-20" />
    </>
  )
} 