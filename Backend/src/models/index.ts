// Backend/src/models/index.ts

export interface Rol {
  IdRol: number;
  RolNombre: string;
}

export interface Usuario {
  IdUsuario?: number;
  Nombre: string;
  Apellido: string;
  UsuarioNombre: string;
  ClaveHash?: string;
  IdRol: number;
  Activo: boolean;
  FechaRegistro?: Date;
  Rol?: Rol;
  
  // CAMPOS PARA PERFIL
  FotoPerfil?: string;      // Base64 o URL
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  FechaNacimiento?: Date;
}

export interface Categoria {
  IdCategoria?: number;
  Nombre: string;
  Descripcion?: string;
}

export interface Producto {
  IdProducto?: number;
  Nombre: string;
  CodigoBarras?: string;
  IdCategoria: number;
  Precio: number;
  Stock: number;
  Estado: boolean;
  Descripcion?: string;
  StockMinimo: number;
  FechaRegistro?: Date;
  EsProductoFinal: boolean;
  Categoria?: Categoria;
}

export interface Venta {
  IdVenta?: number;
  Fecha?: Date;
  IdUsuario: number;
  Total: number;
  MetodoPago: string;
  Comentario?: string;
  Estado: boolean;
  FechaVenta?: Date;
  CantidadTotalProductos?: number;
  Usuario?: Usuario;
  DetallesVenta?: DetalleVenta[];
}

export interface DetalleVenta {
  IdDetalle?: number;
  IdVenta?: number;
  IdProducto: number;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: number;
  Producto?: Producto;
}

export interface Reporte {
  IdReporte?: number;
  IdUsuario: number;
  TipoReporte: string;
  FechaGeneracion?: Date;
  RutaArchivo: string;
  Usuario?: Usuario;
}

export interface LoginRequest {
  usuario: string;
  clave: string;
}

export interface LoginResponse {
  message: string;
  usuario: Omit<Usuario, 'ClaveHash'>;
  token: string;
}

export interface HistorialSesion {
  IdSesion?: number;
  IdUsuario: number;
  FechaHora?: Date;
  DireccionIP: string;
  Navegador: string;
  Dispositivo: string;
  SistemaOperativo: string;
  Exitoso: boolean;
  MotivoFallo?: string;
  Usuario?: Usuario;
}

// Request para actualizar perfil
export interface ActualizarPerfilRequest {
  Nombre?: string;
  Apellido?: string;
  FotoPerfil?: string;
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  FechaNacimiento?: string;
}

// Tipos adicionales para el frontend
export interface PerfilUsuario extends Omit<Usuario, 'ClaveHash'> {}

export interface ActualizarFotoRequest {
  FotoPerfil: string;
}