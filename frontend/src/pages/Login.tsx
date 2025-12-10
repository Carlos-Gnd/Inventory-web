// frontend/src/pages/Login.tsx
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, User, LogIn, Package } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
 
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
   
    if (!usuario.trim() || !clave.trim()) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setIsLoading(true)
   
    try {
      await login(usuario, clave)
      toast.success('¡Bienvenido!')
      navigate('/dashboard')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Usuario o contraseña incorrectos'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
       
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Package className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold">Smart Inventory</h1>
          </div>
         
          <h2 className="text-3xl font-semibold mb-4">
            Sistema de Gestión de Inventario
          </h2>
         
          <p className="text-lg text-primary-100 mb-8">
            Gestiona tus productos, ventas y reportes de manera eficiente y moderna.
          </p>
         
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold">Control de Inventario</h3>
                <p className="text-primary-100 text-sm">Gestiona productos y categorías</p>
              </div>
            </div>
           
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold">Punto de Venta</h3>
                <p className="text-primary-100 text-sm">Registra ventas rápidamente</p>
              </div>
            </div>
           
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold">Reportes y Análisis</h3>
                <p className="text-primary-100 text-sm">Exporta en Excel y PDF</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Inventory</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Ingresa tu usuario"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Ingresa tu contraseña"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Credenciales de prueba:</p>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p><span className="font-medium">Admin:</span> admin / admin123</p>
                <p><span className="font-medium">Cajero:</span> cajero / cajero123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Smart Inventory v1.0 © 2025
          </p>
        </div>
      </div>
    </div>
  )
}