// frontend/src/pages/Usuarios.tsx
import { useState, useEffect } from 'react';
import { usuarioService } from '../services/usuarioService';
import { Usuario, Rol } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { Plus, Edit, Trash2, User, Lock } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { ROLES } from '../utils/constants';
import { isNotEmpty, minLength } from '../utils/validators';

const ROLES_OPTIONS: Rol[] = [
  { IdRol: 1, RolNombre: 'Administrador' },
  { IdRol: 2, RolNombre: 'Cajero' }
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    Nombre: '',
    Apellido: '',
    UsuarioNombre: '',
    ClaveHash: '',
    IdRol: 2,
    Activo: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [debouncedSearch, usuarios]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.listar();
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsuarios = () => {
    if (!debouncedSearch) {
      setFilteredUsuarios(usuarios);
      return;
    }

    const filtered = usuarios.filter(
      (u) =>
        u.Nombre.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.Apellido.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.UsuarioNombre.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    setFilteredUsuarios(filtered);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!isNotEmpty(formData.Nombre)) {
      errors.Nombre = 'El nombre es requerido';
    }
    if (!isNotEmpty(formData.Apellido)) {
      errors.Apellido = 'El apellido es requerido';
    }
    if (!isNotEmpty(formData.UsuarioNombre)) {
      errors.UsuarioNombre = 'El usuario es requerido';
    }
    if (!isEditing && !minLength(formData.ClaveHash, 6)) {
      errors.ClaveHash = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setIsEditing(true);
      setSelectedUsuario(usuario);
      setFormData({
        Nombre: usuario.Nombre,
        Apellido: usuario.Apellido,
        UsuarioNombre: usuario.UsuarioNombre,
        ClaveHash: '',
        IdRol: usuario.IdRol,
        Activo: usuario.Activo
      });
    } else {
      setIsEditing(false);
      setSelectedUsuario(null);
      setFormData({
        Nombre: '',
        Apellido: '',
        UsuarioNombre: '',
        ClaveHash: '',
        IdRol: 2,
        Activo: true
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(null);
    setFormData({
      Nombre: '',
      Apellido: '',
      UsuarioNombre: '',
      ClaveHash: '',
      IdRol: 2,
      Activo: true
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing && selectedUsuario) {
        await usuarioService.editar(selectedUsuario.IdUsuario!, formData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usuarioService.registrar(formData);
        toast.success('Usuario creado exitosamente');
      }
      await fetchUsuarios();
      handleCloseModal();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al guardar usuario';
      toast.error(message);
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${usuario.UsuarioNombre}?`)) {
      return;
    }

    try {
      await usuarioService.eliminar(usuario.IdUsuario!);
      toast.success('Usuario eliminado exitosamente');
      await fetchUsuarios();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al eliminar usuario';
      toast.error(message);
    }
  };

  const columns = [
    {
      key: 'IdUsuario',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'Nombre',
      header: 'Nombre Completo',
      render: (usuario: Usuario) => `${usuario.Nombre} ${usuario.Apellido}`
    },
    {
      key: 'UsuarioNombre',
      header: 'Usuario'
    },
    {
      key: 'IdRol',
      header: 'Rol',
      render: (usuario: Usuario) => (
        <Badge variant={usuario.IdRol === ROLES.ADMIN ? 'info' : 'success'}>
          {usuario.Rol?.RolNombre || (usuario.IdRol === 1 ? 'Administrador' : 'Cajero')}
        </Badge>
      )
    },
    {
      key: 'Activo',
      header: 'Estado',
      render: (usuario: Usuario) => (
        <Badge variant={usuario.Activo ? 'success' : 'danger'}>
          {usuario.Activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '150px',
      render: (usuario: Usuario) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(usuario);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(usuario);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestiona los usuarios del sistema</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => handleOpenModal()}>
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o usuario..."
            className="w-full max-w-md"
          />
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{filteredUsuarios.length}</span> usuarios
          </div>
        </div>

        <Table data={filteredUsuarios} columns={columns} />
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.Nombre}
              onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
              error={formErrors.Nombre}
              placeholder="Juan"
            />
            <Input
              label="Apellido"
              value={formData.Apellido}
              onChange={(e) => setFormData({ ...formData, Apellido: e.target.value })}
              error={formErrors.Apellido}
              placeholder="Pérez"
            />
          </div>

          <Input
            label="Usuario"
            icon={<User className="w-5 h-5 text-gray-400" />}
            value={formData.UsuarioNombre}
            onChange={(e) => setFormData({ ...formData, UsuarioNombre: e.target.value })}
            error={formErrors.UsuarioNombre}
            placeholder="juanperez"
          />

          {!isEditing && (
            <Input
              label="Contraseña"
              type="password"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              value={formData.ClaveHash}
              onChange={(e) => setFormData({ ...formData, ClaveHash: e.target.value })}
              error={formErrors.ClaveHash}
              placeholder="Mínimo 6 caracteres"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select
              value={formData.IdRol}
              onChange={(e) => setFormData({ ...formData, IdRol: Number(e.target.value) })}
              className="input-field"
            >
              {ROLES_OPTIONS.map((rol) => (
                <option key={rol.IdRol} value={rol.IdRol}>
                  {rol.RolNombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.Activo}
              onChange={(e) => setFormData({ ...formData, Activo: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Usuario activo
            </label>
          </div>

          {isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ Para cambiar la contraseña, usa la función "Cambiar Contraseña" después de guardar.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Actualizar' : 'Crear'} Usuario
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