// frontend/src/pages/Descuentos.tsx
import { useState, useEffect } from 'react';
import { Descuento, TipoDescuento } from '../types';
import descuentoService from '../services/descuentoService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Descuento | null>(null);
  const [filtro, setFiltro] = useState('todos');

  const [formData, setFormData] = useState({
    Nombre: '',
    Descripcion: '',
    Tipo: 'porcentaje' as TipoDescuento,
    Valor: 0,
    FechaInicio: '',
    FechaFin: '',
    MontoMinimo: 0,
    CodigoCupon: '',
    UsosMaximos: undefined as number | undefined,
    Activo: true
  });

  useEffect(() => {
    cargarDescuentos();
  }, []);

  const cargarDescuentos = async () => {
    try {
      setLoading(true);
      const data = await descuentoService.listar();
      setDescuentos(data);
    } catch (error) {
      toast.error('Error al cargar descuentos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (descuento?: Descuento) => {
    if (descuento) {
      setEditando(descuento);
      setFormData({
        Nombre: descuento.Nombre,
        Descripcion: descuento.Descripcion || '',
        Tipo: descuento.Tipo,
        Valor: descuento.Valor || 0,
        FechaInicio: descuento.FechaInicio.split('T')[0],
        FechaFin: descuento.FechaFin.split('T')[0],
        MontoMinimo: descuento.MontoMinimo,
        CodigoCupon: descuento.CodigoCupon || '',
        UsosMaximos: descuento.UsosMaximos,
        Activo: descuento.Activo
      });
    } else {
      setEditando(null);
      setFormData({
        Nombre: '',
        Descripcion: '',
        Tipo: 'porcentaje',
        Valor: 0,
        FechaInicio: new Date().toISOString().split('T')[0],
        FechaFin: '',
        MontoMinimo: 0,
        CodigoCupon: '',
        UsosMaximos: undefined,
        Activo: true
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await descuentoService.actualizar(editando.IdDescuento!, formData);
        toast.success('Descuento actualizado');
      } else {
        await descuentoService.crear(formData);
        toast.success('Descuento creado');
      }
      setModalOpen(false);
      cargarDescuentos();
    } catch (error) {
      toast.error('Error al guardar descuento');
    }
  };

  const cambiarEstado = async (id: number, activo: boolean) => {
    try {
      await descuentoService.cambiarEstado(id, !activo);
      toast.success(activo ? 'Descuento desactivado' : 'Descuento activado');
      cargarDescuentos();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const eliminarDescuento = async (id: number) => {
    if (!confirm('¿Eliminar este descuento?')) return;
    try {
      await descuentoService.eliminar(id);
      toast.success('Descuento eliminado');
      cargarDescuentos();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const descuentosFiltrados = descuentos.filter(d => {
    if (filtro === 'activos') return d.Activo;
    if (filtro === 'inactivos') return !d.Activo;
    return true;
  });

  const getTipoBadge = (tipo: string) => {
    const colores: any = {
      porcentaje: 'blue',
      monto_fijo: 'green',
      '2x1': 'purple',
      '3x2': 'pink',
      combo: 'orange'
    };
    return <Badge variant={colores[tipo] || 'default'}>{tipo}</Badge>;
  };

  const columns = [
    {
      key: 'Nombre',
      header: 'Nombre',
      accessor: (d: Descuento) => (
        <div>
          <div className="font-medium">{d.Nombre}</div>
          {d.Descripcion && (
            <div className="text-sm text-gray-500">{d.Descripcion}</div>
          )}
        </div>
      )
    },
    {
      key: 'Tipo',
      header: 'Tipo',
      accessor: (d: Descuento) => getTipoBadge(d.Tipo)
    },
    {
      key: 'Valor',
      header: 'Valor',
      accessor: (d: Descuento) => {
        if (d.Tipo === 'porcentaje') return `${d.Valor}%`;
        if (d.Tipo === 'monto_fijo') return `$${d.Valor}`;
        return '-';
      }
    },
    {
      key: 'Vigencia',
      header: 'Vigencia',
      accessor: (d: Descuento) => (
        <div className="text-sm">
          <div>{new Date(d.FechaInicio).toLocaleDateString()}</div>
          <div>{new Date(d.FechaFin).toLocaleDateString()}</div>
          {d.DiasRestantes !== undefined && (
            <div className={`mt-1 ${d.DiasRestantes < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {d.DiasRestantes < 0 ? 'Expirado' : `${d.DiasRestantes} días restantes`}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'Usos',
      header: 'Usos',
      accessor: (d: Descuento) => (
        <div className="text-sm">
          {d.UsosActuales} {d.UsosMaximos && `/ ${d.UsosMaximos}`}
          {d.PorcentajeUso && (
            <div className="text-xs text-gray-500">{d.PorcentajeUso}%</div>
          )}
        </div>
      )
    },
    {
      key: 'Estado',
      header: 'Estado',
      accessor: (d: Descuento) => (
        <Badge variant={d.Activo ? 'success' : 'default'}>
          {d.Activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'Acciones',
      header: 'Acciones',
      accessor: (d: Descuento) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => abrirModal(d)}>Editar</Button>
          <Button
            size="sm"
            variant={d.Activo ? 'danger' : 'success'}
            onClick={() => cambiarEstado(d.IdDescuento!, d.Activo)}
          >
            {d.Activo ? 'Desactivar' : 'Activar'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => eliminarDescuento(d.IdDescuento!)}>
            Eliminar
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Descuentos y Promociones</h1>
        <Button onClick={() => abrirModal()}>+ Crear Descuento</Button>
      </div>

      <div className="flex gap-4">
        <Button
          variant={filtro === 'todos' ? 'primary' : 'secondary'}
          onClick={() => setFiltro('todos')}
        >
          Todos ({descuentos.length})
        </Button>
        <Button
          variant={filtro === 'activos' ? 'primary' : 'secondary'}
          onClick={() => setFiltro('activos')}
        >
          Activos ({descuentos.filter(d => d.Activo).length})
        </Button>
        <Button
          variant={filtro === 'inactivos' ? 'primary' : 'secondary'}
          onClick={() => setFiltro('inactivos')}
        >
          Inactivos ({descuentos.filter(d => !d.Activo).length})
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={descuentosFiltrados} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Descuento' : 'Crear Descuento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.Nombre}
            onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
            required
          />

          <Input
            label="Descripción"
            value={formData.Descripcion}
            onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Descuento</label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.Tipo}
              onChange={(e) => setFormData({ ...formData, Tipo: e.target.value as TipoDescuento })}
            >
              <option value="porcentaje">Porcentaje</option>
              <option value="monto_fijo">Monto Fijo</option>
              <option value="2x1">2x1</option>
              <option value="3x2">3x2</option>
              <option value="combo">Combo</option>
            </select>
          </div>

          {(formData.Tipo === 'porcentaje' || formData.Tipo === 'monto_fijo') && (
            <Input
              label={formData.Tipo === 'porcentaje' ? 'Porcentaje' : 'Monto'}
              type="number"
              value={formData.Valor}
              onChange={(e) => setFormData({ ...formData, Valor: parseFloat(e.target.value) })}
              min={0}
              max={formData.Tipo === 'porcentaje' ? 100 : undefined}
              step="0.01"
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              value={formData.FechaInicio}
              onChange={(e) => setFormData({ ...formData, FechaInicio: e.target.value })}
              required
            />
            <Input
              label="Fecha Fin"
              type="date"
              value={formData.FechaFin}
              onChange={(e) => setFormData({ ...formData, FechaFin: e.target.value })}
              required
            />
          </div>

          <Input
            label="Monto Mínimo de Compra"
            type="number"
            value={formData.MontoMinimo}
            onChange={(e) => setFormData({ ...formData, MontoMinimo: parseFloat(e.target.value) })}
            min={0}
            step="0.01"
          />

          <Input
            label="Código de Cupón (opcional)"
            value={formData.CodigoCupon}
            onChange={(e) => setFormData({ ...formData, CodigoCupon: e.target.value.toUpperCase() })}
            placeholder="DESCUENTO20"
          />

          <Input
            label="Usos Máximos (opcional)"
            type="number"
            value={formData.UsosMaximos || ''}
            onChange={(e) => setFormData({ ...formData, UsosMaximos: e.target.value ? parseInt(e.target.value) : undefined })}
            min={1}
          />

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Descuentos;