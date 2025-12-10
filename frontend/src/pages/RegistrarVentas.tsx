// frontend/src/pages/RegistrarVentas.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { productoService } from '../services/productoService';
import { ventaService } from '../services/ventaService';
import { Producto } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Receipt } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { METODOS_PAGO } from '../utils/constants';

export default function RegistrarVentas() {
  const { user } = useAuthStore();
  const { items, subtotal, descuento, total, addItem, removeItem, updateQuantity, setDescuento, clearCart } = useCartStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = productos.filter(
        (p) =>
          p.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
          p.Estado &&
          p.Stock > 0
      );
      setFilteredProductos(filtered);
    } else {
      setFilteredProductos([]);
    }
  }, [searchTerm, productos]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const data = await productoService.listarActivos();
      setProductos(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

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
    setSearchTerm('');
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
      `¿Confirmar venta?\n\nTotal: ${formatCurrency(total)}\n${
        metodoPago === 'Efectivo' ? `Vuelto: ${formatCurrency(vuelto)}` : ''
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
      await fetchProductos();
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registrar Venta</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Punto de venta rápido</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Productos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto por nombre..."
              autoFocus
            />

            {searchTerm && filteredProductos.length > 0 && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {filteredProductos.map((producto) => (
                  <div
                    key={producto.IdProducto}
                    onClick={() => handleAgregarProducto(producto)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{producto.Nombre}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{producto.Categoria?.Nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(producto.Precio)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {producto.Stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Carrito */}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.PrecioUnitario)}</p>
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
        </div>

        {/* Panel Derecho - Resumen */}
        <div className="space-y-4">
          <Card title="Resumen de Venta">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Método de Pago</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentario</label>
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
      </div>
    </div>
  );
}