import React, { useState, useRef, useEffect } from 'react'
import { Home, Target, Calendar, Wallet, CreditCard, BarChart3, MessageSquare, Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

interface MobileNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
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

export const MobileNavigation = ({ activeTab, onTabChange }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setIsOpen(false)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      setIsOpen(false)
    }
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger Menu Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="ghost"
        className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Side Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r border-border z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold">Hub Financiero</h2>
                <p className="text-sm text-muted-foreground">Navegación</p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Items */}
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "flex items-center w-full p-4 rounded-lg transition-all duration-200 text-left",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Icon className={cn("h-5 w-5 mr-3", isActive && "text-primary")} />
                    <span className="font-medium">{item.label}</span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        className="ml-auto w-2 h-2 bg-primary rounded-full"
                        layoutId="mobileActiveIndicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-background">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Desliza hacia la izquierda para cerrar
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 