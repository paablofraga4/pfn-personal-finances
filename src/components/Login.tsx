import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'react-hot-toast'
import { Wallet, Loader2 } from 'lucide-react'

export const Login = () => {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      console.log('Iniciando login con Google...')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      
      if (error) {
        throw error
      }
      
      console.log('Login iniciado correctamente')
      toast.success('Redirigiendo a Google...')
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md gradient-card shadow-glow">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Hub Financiero Personal</CardTitle>
          <p className="text-muted-foreground">
            Gestiona tus finanzas de manera inteligente
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Inicia sesión para comenzar a gestionar tus finanzas
            </p>
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full h-12 gradient-primary text-white shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión con Google'
              )}
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signOut()
                  if (error) throw error
                  toast.success('Sesión cerrada')
                } catch (error) {
                  console.error('Error signing out:', error)
                  toast.error('Error al cerrar sesión')
                }
              }}
              variant="outline"
              className="w-full h-12"
            >
              Cerrar Sesión (Debug)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 