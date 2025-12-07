import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Categorias from './pages/Categorias'
import Usuarios from './pages/Usuarios'
import Ventas from './pages/Ventas'
import VentasPropias from './pages/VentasPropias'
import RegistrarVentas from './pages/RegistrarVentas'
import Reportes from './pages/Reportes'

// Layout
import Layout from './components/layout/Layout'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user?.IdRol !== 1) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Admin Only Routes */}
        <Route 
          path="usuarios" 
          element={
            <ProtectedRoute adminOnly>
              <Usuarios />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="categorias" 
          element={
            <ProtectedRoute adminOnly>
              <Categorias />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="productos" 
          element={
            <ProtectedRoute adminOnly>
              <Productos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="ventas" 
          element={
            <ProtectedRoute adminOnly>
              <Ventas />
            </ProtectedRoute>
          } 
        />
        
        {/* Shared Routes (Admin & Cajero) */}
        <Route path="registrar-ventas" element={<RegistrarVentas />} />
        <Route path="ventas-propias" element={<VentasPropias />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App