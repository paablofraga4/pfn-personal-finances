import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { MessageSquare } from 'lucide-react'
import { ModernChatLogger } from './ModernChatLogger'

export const FloatingChatButton = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            size="lg"
            className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Financiero Inteligente
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ModernChatLogger />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}