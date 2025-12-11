// frontend/src/components/features/usuarios/ModalEditarUsuario.tsx
import { useState, useEffect } from 'react';
import { Usuario } from '../../../types';
import { perfilService } from '../../../services/perfilService';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Avatar from '../../common/Avatar';
import { User, Mail, Phone, MapPin, Calendar, Key, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModalEditarUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onActualizado: () => void;
}

export default function ModalEditarUsuario({
  isOpen,
  onClose,
  usuario,
  onActualizado
}: ModalEditarUsuarioProps) {
  const [formData, setFormData] = useState({
    Nombre: usuario.Nombre,
    Apellido: usuario.Apellido,
    Telefono: usuario.Telefono || '',
    Email: usuario.Email || '',
    Direccion: usuario.Direccion || '',
    FechaNacimiento: usuario.FechaNacimiento ? usuario.FechaNacimiento.split('T')[0] : ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  // Modal de cambio de contraseña
  const [modalClaveOpen, setModalClaveOpen] = useState(false);
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmar, setClaveConfirmar] = useState('');
  const [cambiandoClave, setCambiandoClave] = useState(false);

  useEffect(() => {
    setFormData({
      Nombre: usuario.Nombre,
      Apellido: usuario.Apellido,
      Telefono: usuario.Telefono || '',
      Email: usuario.Email || '',
      Direccion: usuario.Direccion || '',
      FechaNacimiento: usuario.FechaNacimiento ? usuario.FechaNacimiento.split('T')[0] : ''
    });
  }, [usuario]);

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
      await perfilService.actualizarPerfilUsuario(usuario.IdUsuario!, formData);
      toast.success('✅ Usuario actualizado exitosamente');
      onActualizado();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Error al actualizar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarClave = async () => {
    if (claveNueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (claveNueva !== claveConfirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setCambiandoClave(true);
    try {
      await perfilService.cambiarClaveUsuario(usuario.IdUsuario!, claveNueva);
      toast.success('✅ Contraseña actualizada exitosamente');
      setModalClaveOpen(false);
      setClaveNueva('');
      setClaveConfirmar('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Error al cambiar contraseña');
    } finally {
      setCambiandoClave(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Editar Usuario: ${usuario.UsuarioNombre}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Info del usuario */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <Avatar
              src={usuario.FotoPerfil}
              nombre={usuario.Nombre}
              apellido={usuario.Apellido}
              size="lg"
            />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {usuario.Nombre} {usuario.Apellido}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">@{usuario.UsuarioNombre}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {usuario.IdRol === 1 ? '🛡️ Administrador' : '👤 Cajero'}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                icon={<User className="w-5 h-5 text-gray-400" />}
                value={formData.Nombre}
                onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                error={errors.Nombre}
                placeholder="Nombre del usuario"
              />
              <Input
                label="Apellido"
                icon={<User className="w-5 h-5 text-gray-400" />}
                value={formData.Apellido}
                onChange={(e) => setFormData({ ...formData, Apellido: e.target.value })}
                error={errors.Apellido}
                placeholder="Apellido del usuario"
              />
            </div>

            <Input
              label="Correo Electrónico"
              type="email"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
              error={errors.Email}
              placeholder="email@ejemplo.com"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                type="tel"
                icon={<Phone className="w-5 h-5 text-gray-400" />}
                value={formData.Telefono}
                onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                error={errors.Telefono}
                placeholder="7777-7777"
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                icon={<Calendar className="w-5 h-5 text-gray-400" />}
                value={formData.FechaNacimiento}
                onChange={(e) => setFormData({ ...formData, FechaNacimiento: e.target.value })}
              />
            </div>

            <Input
              label="Dirección"
              icon={<MapPin className="w-5 h-5 text-gray-400" />}
              value={formData.Direccion}
              onChange={(e) => setFormData({ ...formData, Direccion: e.target.value })}
              placeholder="Dirección completa"
            />
          </div>

          {/* Botón cambiar contraseña */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setModalClaveOpen(true)}
              icon={<Key className="w-5 h-5" />}
              className="w-full"
            >
              Cambiar Contraseña de este Usuario
            </Button>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleGuardar}
              loading={guardando}
              icon={<Save className="w-5 h-5" />}
              className="flex-1"
            >
              Guardar Cambios
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={guardando}
              icon={<X className="w-5 h-5" />}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal
        isOpen={modalClaveOpen}
        onClose={() => {
          setModalClaveOpen(false);
          setClaveNueva('');
          setClaveConfirmar('');
        }}
        title="Cambiar Contraseña"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ℹ️ <strong>Nota:</strong> Esta acción cambiará la contraseña de <strong>{usuario.UsuarioNombre}</strong>. 
              El usuario deberá usar esta nueva contraseña en su próximo inicio de sesión.
            </p>
          </div>

          <Input
            label="Nueva Contraseña"
            type="password"
            icon={<Key className="w-5 h-5 text-gray-400" />}
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            icon={<Key className="w-5 h-5 text-gray-400" />}
            value={claveConfirmar}
            onChange={(e) => setClaveConfirmar(e.target.value)}
            placeholder="Repite la contraseña"
          />

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCambiarClave}
              loading={cambiandoClave}
              icon={<Key className="w-5 h-5" />}
              className="flex-1"
            >
              Cambiar Contraseña
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModalClaveOpen(false)}
              disabled={cambiandoClave}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}