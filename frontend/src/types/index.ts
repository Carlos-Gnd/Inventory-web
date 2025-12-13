// frontend/src/types/index.ts

// Rol
export interface Rol {
  IdRol: number;
  RolNombre: string;
}

// Usuario
export interface Usuario {
  IdUsuario?: number;
  Nombre: string;
  Apellido: string;
  UsuarioNombre: string;
  ClaveHash?: string;
  IdRol: number;
  Activo: boolean;
  FechaRegistro?: string;
  Rol?: Rol;
  
  // CAMPOS DE PERFIL
  FotoPerfil?: string;
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  FechaNacimiento?: string;
}

// Categoría
export interface Categoria {
  IdCategoria?: number;
  Nombre: string;
  Descripcion: string;
}

// Producto
export interface Producto {
  IdProducto?: number;
  Nombre: string;
  CodigoBarras?: string;
  IdCategoria: number;
  Precio: number;
  Stock: number;
  Estado: boolean;
  Descripcion: string;
  StockMinimo: number;
  FechaRegistro?: string;
  EsProductoFinal: boolean;
  Categoria?: Categoria;
}

// Venta
export interface Venta {
  IdVenta?: number;
  Fecha?: string;
  IdUsuario: number;
  Total: number;
  MetodoPago: string;
  Comentario?: string;
  Estado: boolean;
  FechaVenta?: string;
  CantidadTotalProductos?: number;
  Usuario?: Usuario;
  DetallesVenta?: DetalleVenta[];
}

// Detalle Venta
export interface DetalleVenta {
  IdDetalle?: number;
  IdVenta?: number;
  IdProducto: number;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: number;
  Producto?: Producto;
}

// Reporte
export interface Reporte {
  IdReporte?: number;
  IdUsuario: number;
  TipoReporte: string;
  FechaGeneracion?: string;
  RutaArchivo: string;
  Usuario?: Usuario;
}

// API Response
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

// Login
export interface LoginRequest {
  usuario: string;
  clave: string;
}

export interface LoginResponse {
  message: string;
  usuario: Usuario;
  token: string;
}

// Estadísticas Dashboard
export interface EstadisticasVentas {
  totalVentas: number;
  montoTotal: number;
  totalProductos: number;
  promedioVenta: number;
}

export interface EstadisticasProductos {
  totalProductos: number;
  productosActivos: number;
  productosStockBajo: number;
  valorInventario: number;
}

export interface HistorialSesion {
  IdSesion?: number;
  IdUsuario: number;
  FechaHora?: string;
  DireccionIP: string;
  Navegador: string;
  Dispositivo: string;
  SistemaOperativo: string;
  Exitoso: boolean;
  MotivoFallo?: string;
  Usuario?: Usuario;
}

export interface EstadisticasSesiones {
  TotalSesiones: number;
  SesionesExitosas: number;
  SesionesFallidas: number;
  IPsUnicas: number;
  UltimoAcceso: string;
}

// NUEVOS TIPOS PARA PERFIL
export interface ActualizarPerfilRequest {
  Nombre?: string;
  Apellido?: string;
  FotoPerfil?: string;
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  FechaNacimiento?: string;
}

export interface ActualizarFotoRequest {
  FotoPerfil: string;
}

// ==================== NOTIFICACIONES ====================
export type TipoNotificacion = 'stock_bajo' | 'stock_critico' | 'venta' | 'sistema' | 'alerta';
export type PrioridadNotificacion = 'baja' | 'media' | 'alta' | 'critica';

export interface Notificacion {
  IdNotificacion?: number;
  Tipo: TipoNotificacion;
  Titulo: string;
  Mensaje: string;
  IdProducto?: number;
  IdUsuario?: number;
  Prioridad: PrioridadNotificacion;
  Leida: boolean;
  FechaCreacion?: string;
  FechaLeida?: string;
  Icono?: string;
  Color?: string;
  Metadata?: any;
  
  Producto?: {
    Nombre: string;
    Stock: number;
    StockMinimo: number;
  };
}

export interface EstadisticasNotificaciones {
  TotalNotificaciones: number;
  NoLeidas: number;
  Criticas: number;
  Altas: number;
}