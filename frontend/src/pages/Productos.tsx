// frontend/src/pages/Productos.tsx

import { useState, useEffect } from 'react';
import { productoService } from '../services/productoService';
import { categoriaService } from '../services/categoriaService';
import { Producto, Categoria } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import BarcodeDisplay, { BarcodeLabel } from '../components/common/BarcodeDisplay';
import { Plus, Edit, Trash2, Package, AlertTriangle, Barcode } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Modal de Código de Barras
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeProducto, setBarcodeProducto] = useState<Producto | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    Nombre: '',
    CodigoBarras: '',
    IdCategoria: 0,
    Precio: 0,
    Stock: 0,
    StockMinimo: 0,
    Descripcion: '',
    Estado: true,
    EsProductoFinal: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProductos();
  }, [debouncedSearch, productos]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productosData, categoriasData] = await Promise.all([
        productoService.listar(),
        categoriaService.listar()
      ]);
      setProductos(productosData);
      setCategorias(categoriasData);
      setFilteredProductos(productosData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filterProductos = () => {
    if (!debouncedSearch) {
      setFilteredProductos(productos);
      return;
    }

    const filtered = productos.filter(
      (p) =>
        p.Nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.Descripcion && p.Descripcion.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (p.CodigoBarras && p.CodigoBarras.includes(debouncedSearch)) || // 👈 Búsqueda por código
        (p.Categoria?.Nombre && p.Categoria.Nombre.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );

    setFilteredProductos(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.Nombre.trim()) errors.Nombre = 'El nombre es requerido';
    if (formData.IdCategoria === 0) errors.IdCategoria = 'Selecciona una categoría';
    if (formData.Precio <= 0) errors.Precio = 'El precio debe ser mayor a 0';
    if (formData.Stock < 0) errors.Stock = 'El stock no puede ser negativo';
    if (formData.StockMinimo < 0) errors.StockMinimo = 'El stock mínimo no puede ser negativo';

    // Validar código de barras si se proporciona
    if (formData.CodigoBarras && !/^[0-9A-Z\-]+$/.test(formData.CodigoBarras)) {
      errors.CodigoBarras = 'Código de barras inválido (solo números, letras mayúsculas y guiones)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (producto?: Producto) => {
    if (producto) {
      setIsEditing(true);
      setSelectedProducto(producto);
      setFormData({
        Nombre: producto.Nombre,
        CodigoBarras: producto.CodigoBarras || '',
        IdCategoria: producto.IdCategoria,
        Precio: producto.Precio,
        Stock: producto.Stock,
        StockMinimo: producto.StockMinimo,
        Descripcion: producto.Descripcion,
        Estado: producto.Estado,
        EsProductoFinal: producto.EsProductoFinal
      });
    } else {
      setIsEditing(false);
      setSelectedProducto(null);
      setFormData({
        Nombre: '',
        CodigoBarras: '',
        IdCategoria: 0,
        Precio: 0,
        Stock: 0,
        StockMinimo: 0,
        Descripcion: '',
        Estado: true,
        EsProductoFinal: true
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProducto(null);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditing && selectedProducto) {
        await productoService.editar(selectedProducto.IdProducto!, formData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productoService.registrar(formData);
        toast.success('Producto creado exitosamente');
      }
      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar producto');
    }
  };

  const handleDelete = async (producto: Producto) => {
    if (!window.confirm(`¿Eliminar "${producto.Nombre}"?`)) return;

    try {
      await productoService.eliminar(producto.IdProducto!);
      toast.success('Producto eliminado exitosamente');
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar producto');
    }
  };

  const handleVerCodigo = (producto: Producto) => {
    setBarcodeProducto(producto);
    setBarcodeModalOpen(true);
  };

  const columns = [
    { 
      key: 'CodigoBarras', 
      header: 'Código', 
      width: '120px',
      render: (p: Producto) => p.CodigoBarras ? (
        <BarcodeLabel value={p.CodigoBarras} />
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-500">Sin código</span>
      )
    },
    { 
      key: 'Nombre', 
      header: 'Producto'
    },
    {
      key: 'Categoria',
      header: 'Categoría',
      render: (p: Producto) => p.Categoria?.Nombre || 'N/A'
    },
    {
      key: 'Precio',
      header: 'Precio',
      render: (p: Producto) => formatCurrency(p.Precio)
    },
    {
      key: 'Stock',
      header: 'Stock',
      render: (p: Producto) => (
        <div className="flex items-center gap-2">
          <span>{p.Stock}</span>
          {p.Stock <= p.StockMinimo && (
            <AlertTriangle 
              className="w-4 h-4 text-red-500" 
              title="Stock bajo"
              aria-label="Stock bajo"
            />
          )}
        </div>
      )
    },
    {
      key: 'Estado',
      header: 'Estado',
      render: (p: Producto) => (
        <Badge variant={p.Estado ? 'success' : 'danger'}>
          {p.Estado ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '180px',
      render: (producto: Producto) => (
        <div className="flex gap-2">
          {producto.CodigoBarras && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVerCodigo(producto);
              }}
              className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              title="Ver código de barras"
            >
              <Barcode className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(producto);
            }}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(producto);
            }}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestiona tu inventario de productos</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => handleOpenModal()}>
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, código de barras o categoría..."
            className="w-full max-w-md"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-semibold">{filteredProductos.length}</span> productos
          </div>
        </div>

        <Table data={filteredProductos} columns={columns} />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del Producto"
            icon={<Package className="w-5 h-5 text-gray-400" />}
            value={formData.Nombre}
            onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
            error={formErrors.Nombre}
            placeholder="Ej: Pastel de Chocolate"
          />

          {/* Código de Barras */}
          <Input
            label="Código de Barras (Opcional)"
            icon={<Barcode className="w-5 h-5 text-gray-400" />}
            value={formData.CodigoBarras}
            onChange={(e) => setFormData({ ...formData, CodigoBarras: e.target.value.toUpperCase() })}
            error={formErrors.CodigoBarras}
            placeholder="Dejar vacío para generar automáticamente"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <select
              value={formData.IdCategoria}
              onChange={(e) => setFormData({ ...formData, IdCategoria: Number(e.target.value) })}
              className="input-field"
            >
              <option value={0}>Selecciona una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.IdCategoria} value={cat.IdCategoria}>
                  {cat.Nombre}
                </option>
              ))}
            </select>
            {formErrors.IdCategoria && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.IdCategoria}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio"
              type="number"
              step="0.01"
              value={formData.Precio}
              onChange={(e) => setFormData({ ...formData, Precio: parseFloat(e.target.value) || 0 })}
              error={formErrors.Precio}
              placeholder="0.00"
            />
            <Input
              label="Stock Actual"
              type="number"
              value={formData.Stock}
              onChange={(e) => setFormData({ ...formData, Stock: parseInt(e.target.value) || 0 })}
              error={formErrors.Stock}
              placeholder="0"
            />
          </div>

          <Input
            label="Stock Mínimo"
            type="number"
            value={formData.StockMinimo}
            onChange={(e) => setFormData({ ...formData, StockMinimo: parseInt(e.target.value) || 0 })}
            error={formErrors.StockMinimo}
            placeholder="0"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.Descripcion}
              onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="Descripción del producto..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.Estado}
                onChange={(e) => setFormData({ ...formData, Estado: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Producto Activo</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Actualizar' : 'Crear'} Producto
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Código de Barras */}
      <Modal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        title={`Código de Barras - ${barcodeProducto?.Nombre}`}
        size="md"
      >
        {barcodeProducto?.CodigoBarras && (
          <div className="space-y-4">
            <BarcodeDisplay
              value={barcodeProducto.CodigoBarras}
              showValue={true}
              height={80}
              width={2}
            />
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Puedes imprimir este código o escanearlo directamente desde la pantalla con tu lector de códigos de barras.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}