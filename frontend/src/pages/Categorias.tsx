// frontend/src/pages/Categorias.tsx
import { useState, useEffect } from 'react';
import { categoriaService } from '../services/categoriaService';
import { Categoria } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { isNotEmpty, maxLength } from '../utils/validators';

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    Nombre: '',
    Descripcion: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    filterCategorias();
  }, [debouncedSearch, categorias]);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const data = await categoriaService.listar();
      setCategorias(data);
      setFilteredCategorias(data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const filterCategorias = () => {
    if (!debouncedSearch) {
      setFilteredCategorias(categorias);
      return;
    }

    const filtered = categorias.filter(
      (c) =>
        c.Nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (c.Descripcion && c.Descripcion.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
    setFilteredCategorias(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!isNotEmpty(formData.Nombre)) {
      errors.Nombre = 'El nombre es requerido';
    } else if (!maxLength(formData.Nombre, 100)) {
      errors.Nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.Descripcion && !maxLength(formData.Descripcion, 255)) {
      errors.Descripcion = 'La descripción no puede exceder 255 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (categoria?: Categoria) => {
    if (categoria) {
      setIsEditing(true);
      setSelectedCategoria(categoria);
      setFormData({
        Nombre: categoria.Nombre,
        Descripcion: categoria.Descripcion || ''
      });
    } else {
      setIsEditing(false);
      setSelectedCategoria(null);
      setFormData({
        Nombre: '',
        Descripcion: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategoria(null);
    setFormData({
      Nombre: '',
      Descripcion: ''
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing && selectedCategoria) {
        await categoriaService.editar(selectedCategoria.IdCategoria!, formData);
        toast.success('Categoría actualizada exitosamente');
      } else {
        await categoriaService.registrar(formData);
        toast.success('Categoría creada exitosamente');
      }
      await fetchCategorias();
      handleCloseModal();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al guardar categoría';
      toast.error(message);
    }
  };

  const handleDelete = async (categoria: Categoria) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoria.Nombre}"?`)) {
      return;
    }

    try {
      await categoriaService.eliminar(categoria.IdCategoria!);
      toast.success('Categoría eliminada exitosamente');
      await fetchCategorias();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al eliminar categoría';
      toast.error(message);
    }
  };

  const columns = [
    {
      key: 'IdCategoria',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'Nombre',
      header: 'Nombre'
    },
    {
      key: 'Descripcion',
      header: 'Descripción',
      render: (categoria: Categoria) => categoria.Descripcion || '-'
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '150px',
      render: (categoria: Categoria) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(categoria);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(categoria);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-2">Organiza tus productos por categorías</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => handleOpenModal()}>
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full max-w-md"
          />
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{filteredCategorias.length}</span> categorías
          </div>
        </div>

        <Table data={filteredCategorias} columns={columns} />
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            icon={<FolderOpen className="w-5 h-5 text-gray-400" />}
            value={formData.Nombre}
            onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
            error={formErrors.Nombre}
            placeholder="Ej: Pasteles, Bebidas, Panes..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.Descripcion}
              onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
              className="input-field min-h-[100px]"
              placeholder="Descripción opcional de la categoría..."
            />
            {formErrors.Descripcion && (
              <p className="mt-1 text-sm text-red-600">{formErrors.Descripcion}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Actualizar' : 'Crear'} Categoría
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}