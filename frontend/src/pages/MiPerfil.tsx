// frontend/src/pages/MiPerfil.tsx - REDISEÑO COMPLETO
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { perfilService } from '../services/perfilService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  User, Mail, Phone, MapPin, Calendar, Camera, Save, X,
  Upload, Trash2, Edit3, Check, Shield, Clock, Lock, 
  ArrowLeft, Key, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/formatters';

export default function MiPerfil() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para cambio de contraseña
  const [modalClaveOpen, setModalClaveOpen] = useState(false);
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmar, setClaveConfirmar] = useState('');
  const [mostrarClaves, setMostrarClaves] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  });

  const [formData, setFormData] = useState({
    Nombre: user?.Nombre || '',
    Apellido: user?.Apellido || '',
    Telefono: user?.Telefono || '',
    Email: user?.Email || '',
    Direccion: user?.Direccion || '',
    FechaNacimiento: user?.FechaNacimiento ? user.FechaNacimiento.split('T')[0] : ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    setLoading(true);
    try {
      const perfil = await perfilService.obtenerMiPerfil();
      setUser(perfil);
      setFormData({
        Nombre: perfil.Nombre || '',
        Apellido: perfil.Apellido || '',
        Telefono: perfil.Telefono || '',
        Email: perfil.Email || '',
        Direccion: perfil.Direccion || '',
        FechaNacimiento: perfil.FechaNacimiento ? perfil.FechaNacimiento.split('T')[0] : ''
      });
    } catch (error) {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.Nombre.trim()) {
      newErrors.Nombre = 'El nombre es requerido';
    }

    if (!formData.Apellido.trim()) {
      newErrors.Apellido = 'El apellido es requerido';
    }

    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Email inválido';
    }

    if (formData.Telefono && !/^[0-9\-\s\+\(\)]*$/.test(formData.Telefono)) {
      newErrors.Telefono = 'Teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    setGuardando(true);
    try {
      const response = await perfilService.actualizarMiPerfil(formData);
      setUser(response.usuario);
      toast.success('✅ Perfil actualizado exitosamente');
      setModoEdicion(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Error al actualizar perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setFormData({
      Nombre: user?.Nombre || '',
      Apellido: user?.Apellido || '',
      Telefono: user?.Telefono || '',
      Email: user?.Email || '',
      Direccion: user?.Direccion || '',
      FechaNacimiento: user?.FechaNacimiento ? user.FechaNacimiento.split('T')[0] : ''
    });
    setErrors({});
    setModoEdicion(false);
  };

  const handleCambiarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!perfilService.validarTipoImagen(file)) {
      toast.error('❌ Solo se permiten imágenes JPG, PNG o GIF');
      return;
    }

    if (!perfilService.validarTamañoImagen(file)) {
      toast.error('❌ La imagen no puede exceder 2MB');
      return;
    }

    try {
      setSubiendoFoto(true);
      const base64 = await perfilService.convertirABase64(file);
      const response = await perfilService.actualizarFoto(base64);
      
      if (user) {
        setUser({ ...user, FotoPerfil: response.FotoPerfil });
      }
      
      toast.success('✅ Foto actualizada exitosamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Error al actualizar foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;

    setSubiendoFoto(true);
    try {
      await perfilService.eliminarFoto();
      
      if (user) {
        setUser({ ...user, FotoPerfil: undefined });
      }
      
      toast.success('✅ Foto eliminada exitosamente');
    } catch (error) {
      toast.error('❌ Error al eliminar foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleCambiarClave = async () => {
    if (!claveActual.trim()) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }

    if (claveNueva.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (claveNueva !== claveConfirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      await perfilService.cambiarMiClave(claveActual, claveNueva);
      toast.success('✅ Contraseña actualizada exitosamente');
      setModalClaveOpen(false);
      setClaveActual('');
      setClaveNueva('');
      setClaveConfirmar('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Error al cambiar contraseña');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header con botón de regresar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft className="w-5 h-5" />}
            size="lg"
          >
            Regresar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Administra tu información personal</p>
          </div>
        </div>
        
        {!modoEdicion && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setModalClaveOpen(true)}
              icon={<Key className="w-5 h-5" />}
              size="lg"
            >
              Cambiar Contraseña
            </Button>
            <Button
              onClick={() => setModoEdicion(true)}
              icon={<Edit3 className="w-5 h-5" />}
              size="lg"
            >
              Editar Perfil
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Avatar y Info Rápida */}
        <div className="lg:col-span-4">
          <Card className="sticky top-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar con overlay */}
              <div className="relative group mb-6">
                <Avatar
                  src={user?.FotoPerfil}
                  nombre={user?.Nombre}
                  apellido={user?.Apellido}
                  size="xl"
                  className="transition-all duration-300 group-hover:opacity-75 ring-4 ring-primary-100 dark:ring-primary-900"
                />
                
                {/* Overlay para cambiar foto */}
                <div
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {subiendoFoto ? (
                      <div className="animate-spin">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 text-white" />
                        <span className="text-white text-xs font-medium">Cambiar foto</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleCambiarFoto}
                  className="hidden"
                  disabled={subiendoFoto}
                />
              </div>

              {/* Nombre y usuario */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {user?.Nombre} {user?.Apellido}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                @{user?.UsuarioNombre}
              </p>

              {/* Badge de rol */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                user?.IdRol === 1
                  ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              }`}>
                <Shield className="w-4 h-4" />
                {user?.IdRol === 1 ? 'Administrador' : 'Cajero'}
              </div>

              {/* Botones de foto */}
              {user?.FotoPerfil && (
                <div className="flex gap-2 w-full mb-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoFoto}
                    icon={<Camera className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Cambiar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleEliminarFoto}
                    disabled={subiendoFoto}
                    icon={<Trash2 className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              )}

              {/* Información adicional */}
              <div className="w-full pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Miembro desde
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user?.FechaRegistro ? formatDate(user.FechaRegistro) : 'N/A'}
                  </span>
                </div>
                
                {user?.Email && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white truncate ml-2">
                      {user.Email}
                    </span>
                  </div>
                )}
                
                {user?.Telefono && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.Telefono}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="lg:col-span-8 space-y-6">
          {/* Información Personal */}
          <Card title="Información Personal" subtitle="Actualiza tus datos básicos">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  value={formData.Nombre}
                  onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                  error={errors.Nombre}
                  disabled={!modoEdicion}
                  placeholder="Tu nombre"
                />
                <Input
                  label="Apellido"
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  value={formData.Apellido}
                  onChange={(e) => setFormData({ ...formData, Apellido: e.target.value })}
                  error={errors.Apellido}
                  disabled={!modoEdicion}
                  placeholder="Tu apellido"
                />
              </div>

              <Input
                label="Correo Electrónico"
                type="email"
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                error={errors.Email}
                disabled={!modoEdicion}
                placeholder="tu@email.com"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  type="tel"
                  icon={<Phone className="w-5 h-5 text-gray-400" />}
                  value={formData.Telefono}
                  onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                  error={errors.Telefono}
                  disabled={!modoEdicion}
                  placeholder="7777-7777"
                />
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  icon={<Calendar className="w-5 h-5 text-gray-400" />}
                  value={formData.FechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, FechaNacimiento: e.target.value })}
                  disabled={!modoEdicion}
                />
              </div>

              <Input
                label="Dirección"
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
                value={formData.Direccion}
                onChange={(e) => setFormData({ ...formData, Direccion: e.target.value })}
                disabled={!modoEdicion}
                placeholder="Tu dirección completa"
              />

              {modoEdicion && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleGuardar}
                    loading={guardando}
                    icon={<Check className="w-5 h-5" />}
                    className="flex-1"
                    size="lg"
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelar}
                    disabled={guardando}
                    icon={<X className="w-5 h-5" />}
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Información de Cuenta */}
          <Card title="Información de Cuenta" subtitle="Detalles de tu cuenta en el sistema">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Usuario
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.UsuarioNombre}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Rol
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.IdRol === 1 ? 'Administrador' : 'Cajero'}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estado</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  user?.Activo
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${user?.Activo ? 'bg-green-500' : 'bg-red-500'}`} />
                  {user?.Activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Miembro desde
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.FechaRegistro ? formatDate(user.FechaRegistro) : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          {/* Tips de seguridad */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  💡 Tips de Seguridad
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Mantén tu información actualizada</li>
                  <li>• Usa una foto de perfil profesional</li>
                  <li>• Verifica tu email y teléfono</li>
                  <li>• Cambia tu contraseña periódicamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cambio de Contraseña */}
      <Modal
        isOpen={modalClaveOpen}
        onClose={() => {
          setModalClaveOpen(false);
          setClaveActual('');
          setClaveNueva('');
          setClaveConfirmar('');
        }}
        title="Cambiar Contraseña"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <p className="font-medium">Importante:</p>
              <p>Asegúrate de recordar tu nueva contraseña. Deberás usarla en tu próximo inicio de sesión.</p>
            </div>
          </div>

          <Input
            label="Contraseña Actual"
            type={mostrarClaves.actual ? 'text' : 'password'}
            icon={<Lock className="w-5 h-5 text-gray-400" />}
            value={claveActual}
            onChange={(e) => setClaveActual(e.target.value)}
            placeholder="Ingresa tu contraseña actual"
          />

          <Input
            label="Nueva Contraseña"
            type={mostrarClaves.nueva ? 'text' : 'password'}
            icon={<Key className="w-5 h-5 text-gray-400" />}
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />

          <Input
            label="Confirmar Nueva Contraseña"
            type={mostrarClaves.confirmar ? 'text' : 'password'}
            icon={<Key className="w-5 h-5 text-gray-400" />}
            value={claveConfirmar}
            onChange={(e) => setClaveConfirmar(e.target.value)}
            placeholder="Repite la nueva contraseña"
          />

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCambiarClave}
              icon={<Check className="w-5 h-5" />}
              className="flex-1"
            >
              Cambiar Contraseña
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModalClaveOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}