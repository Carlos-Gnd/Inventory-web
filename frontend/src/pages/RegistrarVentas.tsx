// frontend/src/pages/RegistrarVentas.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { productoService } from '../services/productoService';
import { ventaService } from '../services/ventaService';
import { categoriaService } from '../services/categoriaService';
import { Producto, Categoria } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { 
  ShoppingCart, Plus, Minus, Trash2, DollarSign, Receipt, 
  Package, AlertTriangle, ArrowUpDown, Eye, EyeOff 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { METODOS_PAGO } from '../utils/constants';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { BarcodeLabel } from '../components/common/BarcodeDisplay';

type SortField = 'Nombre' | 'Precio' | 'Stock' | 'Categoria';
type SortOrder = 'asc' | 'desc';

export default function RegistrarVentas() {
  const { user } = useAuthStore();
  const { items, subtotal, descuento, total, addItem, removeItem, updateQuantity, setDescuento, clearCart } = useCartStore();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de filtros y ordenamiento
  const [selectedCategoria, setSelectedCategoria] = useState<number>(0);
  const [soloConStock, setSoloConStock] = useState(true);
  const [sortField, setSortField] = useState<SortField>('Nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [mostrarTabla, setMostrarTabla] = useState(true);
  
  // Estados de venta
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F1: Focus en búsqueda
      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      // F2: Toggle tabla de productos
      if (e.key === 'F2') {
        e.preventDefault();
        setMostrarTabla(prev => !prev);
      }
      // Escape: Limpiar búsqueda
      if (e.key === 'Escape') {
        setSearchTerm('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Escaneo de códigos de barras
  const handleBarcodeScanned = useCallback((code: string) => {
    // Buscar producto por código
    const producto = productos.find(p => 
      p.CodigoBarras === code && p.Estado && p.Stock > 0
    );

    if (producto) {
      handleAgregarProducto(producto);
      toast.success(`📦 ${producto.Nombre} escaneado`, { icon: '📷' });
    } else {
      toast.error(`Código ${code} no encontrado o sin stock`);
    }
  }, [productos]);

  // Activar scanner
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
    minLength: 8,
    maxLength: 20,
    enabled: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productosData, categoriasData] = await Promise.all([
        productoService.listar(),
        categoriaService.listar()
      ]);
      setProductos(productosData);
      setCategorias(categoriasData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Productos filtrados y ordenados
  const productosFiltrados = useMemo(() => {
    let filtered = productos.filter(p => p.Estado);

    // Filtro por stock
    if (soloConStock) {
      filtered = filtered.filter(p => p.Stock > 0);
    }

    // Filtro por categoría
    if (selectedCategoria !== 0) {
      filtered = filtered.filter(p => p.IdCategoria === selectedCategoria);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.Descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'Nombre':
          comparison = a.Nombre.localeCompare(b.Nombre);
          break;
        case 'Precio':
          comparison = a.Precio - b.Precio;
          break;
        case 'Stock':
          comparison = a.Stock - b.Stock;
          break;
        case 'Categoria':
          comparison = (a.Categoria?.Nombre || '').localeCompare(b.Categoria?.Nombre || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [productos, searchTerm, selectedCategoria, soloConStock, sortField, sortOrder]);

  const handleAgregarProducto = (producto: Producto) => {
    if (producto.Stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    const cantidadEnCarrito = items.find(i => i.IdProducto === producto.IdProducto)?.Cantidad || 0;
    if (cantidadEnCarrito >= producto.Stock) {
      toast.error(`Stock máximo: ${producto.Stock}`);
      return;
    }

    addItem(producto, 1);
    toast.success(`${producto.Nombre} agregado`);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFinalizarVenta = async () => {
    if (items.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }

    if (metodoPago === 'Efectivo' && montoRecibido < total) {
      toast.error('Monto insuficiente');
      return;
    }

    const vuelto = metodoPago === 'Efectivo' ? montoRecibido - total : 0;

    const confirmacion = window.confirm(
      `¿Confirmar venta?\n\nTotal: ${formatCurrency(total)}${
        metodoPago === 'Efectivo' ? `\nVuelto: ${formatCurrency(vuelto)}` : ''
      }`
    );

    if (!confirmacion) return;

    setProcesando(true);
    try {
      const venta = {
        IdUsuario: user!.IdUsuario!,
        Total: total,
        MetodoPago: metodoPago,
        Comentario: comentario,
        Estado: true,
        DetallesVenta: items.map(item => ({
          IdProducto: item.IdProducto,
          Cantidad: item.Cantidad,
          PrecioUnitario: item.PrecioUnitario,
          Subtotal: item.Subtotal
        }))
      };

      await ventaService.registrar(venta);

      toast.success(
        `✅ Venta registrada\n${metodoPago === 'Efectivo' ? `Vuelto: ${formatCurrency(vuelto)}` : ''}`,
        { duration: 4000 }
      );

      clearCart();
      setMetodoPago('Efectivo');
      setMontoRecibido(0);
      setComentario('');
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar venta');
    } finally {
      setProcesando(false);
    }
  };

  const vuelto = metodoPago === 'Efectivo' ? Math.max(0, montoRecibido - total) : 0;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registrar Venta</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Punto de venta rápido</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={mostrarTabla ? 'success' : 'default'}>
            {productosFiltrados.length} productos
          </Badge>
          <Button
            variant="secondary"
            onClick={() => setMostrarTabla(!mostrarTabla)}
            icon={mostrarTabla ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          >
            {mostrarTabla ? 'Ocultar' : 'Mostrar'} Tabla
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panel Izquierdo/Central - Productos */}
        <div className={`space-y-4 ${mostrarTabla ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          {/* Barra de Búsqueda y Filtros */}
          <Card>
            <div className="space-y-4">
              {/* Búsqueda */}
              <div>
                <SearchBar
                  id="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto (F1)..."
                  autoFocus
                />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por Categoría */}
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(Number(e.target.value))}
                  className="input-field flex-1 min-w-[200px]"
                >
                  <option value={0}>📦 Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.IdCategoria} value={cat.IdCategoria}>
                      {cat.Nombre}
                    </option>
                  ))}
                </select>

                {/* Toggle Solo con Stock */}
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={soloConStock}
                    onChange={(e) => setSoloConStock(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Solo con stock
                  </span>
                </label>

                {/* Info de Atajos */}
                <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
                  💡 F1: Buscar | F2: Toggle tabla | ESC: Limpiar | 📷 Escanea códigos
                </div>
              </div>
            </div>
          </Card>

          {/* Tabla de Productos */}
          {mostrarTabla && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleSort('Nombre')}
                      >
                        <div className="flex items-center gap-2">
                          Producto
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleSort('Categoria')}
                      >
                        <div className="flex items-center gap-2">
                          Categoría
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleSort('Precio')}
                      >
                        <div className="flex items-center gap-2">
                          Precio
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleSort('Stock')}
                      >
                        <div className="flex items-center gap-2">
                          Stock
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {productosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>No hay productos disponibles</p>
                        </td>
                      </tr>
                    ) : (
                      productosFiltrados.map((producto) => {
                        const stockBajo = producto.Stock <= producto.StockMinimo;
                        const enCarrito = items.find(i => i.IdProducto === producto.IdProducto);
                        
                        return (
                          <tr
                            key={producto.IdProducto}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            onClick={() => handleAgregarProducto(producto)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {producto.Nombre}
                                  </p>
                                  {producto.Descripcion && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                      {producto.Descripcion}
                                    </p>
                                  )}
                                  {producto.CodigoBarras && (
                                    <BarcodeLabel value={producto.CodigoBarras} />
                                  )}
                                </div>
                                {enCarrito && (
                                  <Badge variant="info">
                                    {enCarrito.Cantidad} en carrito
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {producto.Categoria?.Nombre}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-primary-600 dark:text-primary-400">
                                {formatCurrency(producto.Precio)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${
                                  stockBajo 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {producto.Stock}
                                </span>
                                {stockBajo && (
                                  <AlertTriangle 
                                    className="w-4 h-4 text-red-500" 
                                    title="Stock bajo"
                                    aria-label="Stock bajo" 
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAgregarProducto(producto);
                                }}
                                disabled={producto.Stock === 0}
                                icon={<Plus className="w-4 h-4" />}
                              >
                                Agregar
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Carrito (Mobile) */}
          {!mostrarTabla && (
            <Card title="Carrito de Compras" subtitle={`${items.length} productos`}>
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No hay productos en el carrito</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.IdProducto} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.Producto?.Nombre}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.Cantidad} x {formatCurrency(item.PrecioUnitario)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.IdProducto, item.Cantidad - 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.Cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.IdProducto, item.Cantidad + 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          disabled={item.Cantidad >= (item.Producto?.Stock || 0)}
                        >
                          <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.Subtotal)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.IdProducto)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Panel Derecho - Resumen */}
        {mostrarTabla && (
          <div className="space-y-4">
            {/* Carrito */}
            <Card title="Carrito" subtitle={`${items.length} productos`}>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Carrito vacío</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.IdProducto} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.Producto?.Nombre}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.Cantidad} × {formatCurrency(item.PrecioUnitario)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.IdProducto, item.Cantidad - 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.Cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.IdProducto, item.Cantidad + 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          disabled={item.Cantidad >= (item.Producto?.Stock || 0)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white min-w-[80px] text-right">
                        {formatCurrency(item.Subtotal)}
                      </p>
                      <button
                        onClick={() => removeItem(item.IdProducto)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Resumen de Pago */}
            <Card title="Resumen">
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>

                <Input
                  label="Descuento"
                  type="number"
                  step="0.01"
                  value={descuento}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  icon={<DollarSign className="w-5 h-5 text-gray-400" />}
                />

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-xl font-bold text-primary-600 dark:text-primary-400">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="input-field"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {metodoPago === 'Efectivo' && (
                  <>
                    <Input
                      label="Monto Recibido"
                      type="number"
                      step="0.01"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)}
                      icon={<DollarSign className="w-5 h-5 text-gray-400" />}
                    />
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-gray-700 dark:text-gray-300">Vuelto:</span>
                      <span className={vuelto < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {formatCurrency(vuelto)}
                      </span>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comentario
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="input-field min-h-[60px]"
                    placeholder="Comentario opcional..."
                  />
                </div>

                <Button
                  onClick={handleFinalizarVenta}
                  loading={procesando}
                  disabled={items.length === 0 || (metodoPago === 'Efectivo' && montoRecibido < total)}
                  className="w-full"
                  icon={<Receipt className="w-5 h-5" />}
                >
                  Finalizar Venta
                </Button>

                {items.length > 0 && (
                  <Button
                    onClick={clearCart}
                    variant="secondary"
                    className="w-full"
                  >
                    Limpiar Carrito
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}