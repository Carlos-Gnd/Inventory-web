// frontend/src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  TrendingUp,
  Shield
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
}

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    name: 'Usuarios',
    path: '/usuarios',
    icon: <Users className="w-5 h-5" />,
    adminOnly: true
  },
  {
    name: 'Historial Sesiones',
    path: '/historial-sesiones',
    icon: <Shield className="w-5 h-5" />,
    adminOnly: true
  },
  {
    name: 'Categorías',
    path: '/categorias',
    icon: <FolderOpen className="w-5 h-5" />,
    adminOnly: true
  },
  {
    name: 'Productos',
    path: '/productos',
    icon: <Package className="w-5 h-5" />,
    adminOnly: true
  },
  {
    name: 'Ventas',
    path: '/ventas',
    icon: <ShoppingCart className="w-5 h-5" />,
    adminOnly: true
  },
  {
    name: 'Registrar Venta',
    path: '/registrar-ventas',
    icon: <Receipt className="w-5 h-5" />
  },
  {
    name: 'Mis Ventas',
    path: '/ventas-propias',
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    name: 'Reportes',
    path: '/reportes',
    icon: <FileText className="w-5 h-5" />
  }
]

export default function Sidebar({ isOpen }: SidebarProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.IdRol === 1

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false
    }
    return true
  })

  return (
    <aside
      className={`
        fixed left-0 top-16 bottom-0 w-64
        bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
        transition-transform duration-300 z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="h-full overflow-y-auto py-6">
        <nav className="px-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 px-4">
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-primary-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Acceso Rápido
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Usa atajos de teclado para navegar más rápido
            </p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 font-mono text-gray-700 dark:text-gray-300">F1</kbd>
                <span>Buscar producto</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 font-mono text-gray-700 dark:text-gray-300">F2</kbd>
                <span>Nueva venta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}