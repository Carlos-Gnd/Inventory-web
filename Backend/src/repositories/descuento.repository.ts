// Backend/src/repositories/descuento.repository.ts

import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Descuento {
  IdDescuento?: number;
  Nombre: string;
  Descripcion?: string;
  Tipo: 'porcentaje' | 'monto_fijo' | '2x1' | '3x2' | 'combo';
  Valor?: number;
  FechaInicio: string;
  FechaFin: string;
  Activo: boolean;
  MontoMinimo: number;
  IdCategoriaAplica?: number;
  IdProductoAplica?: number;
  CodigoCupon?: string;
  UsosMaximos?: number;
  UsosActuales?: number;
  ProductosCombo?: any;
  CreadoPor: number;
  FechaCreacion?: string;
  CategoriaNombre?: string;
  ProductoNombre?: string;
  DiasRestantes?: number;
  PorcentajeUso?: string;
}

export interface VentaDescuento {
  IdVentaDescuento?: number;
  IdVenta: number;
  IdDescuento: number;
  MontoDescuento: number;
  TipoDescuento: string;
  DescripcionDescuento?: string;
}

// NUEVO: Interfaz para items del carrito
export interface ItemCarrito {
  IdProducto: number;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: number;
  IdCategoria?: number;
}

// NUEVO: Resultado de aplicar descuentos
export interface ResultadoDescuentos {
  descuentosAplicados: DescuentoAplicado[];
  subtotal: number;
  totalDescuento: number;
  total: number;
}

export interface DescuentoAplicado {
  descuento: Descuento;
  montoDescuento: number;
  descripcion: string;
  itemsAfectados?: number[]; // IDs de productos afectados
}

export class DescuentoRepository {
  
  // ==================== CRUD BÁSICO ====================
  
  async listar(): Promise<Descuento[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        d.*,
        c.Nombre AS CategoriaNombre,
        p.Nombre AS ProductoNombre,
        DATEDIFF(d.FechaFin, NOW()) AS DiasRestantes,
        CASE 
          WHEN d.UsosMaximos IS NULL THEN 'Ilimitado'
          ELSE CONCAT(ROUND((d.UsosActuales / d.UsosMaximos) * 100, 1), '%')
        END AS PorcentajeUso
      FROM Descuentos d
      LEFT JOIN Categorias c ON d.IdCategoriaAplica = c.IdCategoria
      LEFT JOIN Productos p ON d.IdProductoAplica = p.IdProducto
      ORDER BY d.FechaCreacion DESC
    `);

    return rows.map(this.mapRowToDescuento);
  }

  async listarActivos(): Promise<Descuento[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM vw_DescuentosActivos
      ORDER BY 
        CASE Tipo
          WHEN '2x1' THEN 1
          WHEN '3x2' THEN 2
          WHEN 'combo' THEN 3
          WHEN 'porcentaje' THEN 4
          WHEN 'monto_fijo' THEN 5
        END
    `);

    return rows.map(this.mapRowToDescuento);
  }

  async obtenerPorId(id: number): Promise<Descuento | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        d.*,
        c.Nombre AS CategoriaNombre,
        p.Nombre AS ProductoNombre
      FROM Descuentos d
      LEFT JOIN Categorias c ON d.IdCategoriaAplica = c.IdCategoria
      LEFT JOIN Productos p ON d.IdProductoAplica = p.IdProducto
      WHERE d.IdDescuento = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return this.mapRowToDescuento(rows[0]);
  }

  async crear(descuento: Descuento): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Descuentos (
        Nombre, Descripcion, Tipo, Valor,
        FechaInicio, FechaFin, Activo,
        MontoMinimo, IdCategoriaAplica, IdProductoAplica,
        CodigoCupon, UsosMaximos, ProductosCombo, CreadoPor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        descuento.Nombre,
        descuento.Descripcion || null,
        descuento.Tipo,
        descuento.Valor || null,
        descuento.FechaInicio,
        descuento.FechaFin,
        descuento.Activo,
        descuento.MontoMinimo,
        descuento.IdCategoriaAplica || null,
        descuento.IdProductoAplica || null,
        descuento.CodigoCupon || null,
        descuento.UsosMaximos || null,
        descuento.ProductosCombo ? JSON.stringify(descuento.ProductosCombo) : null,
        descuento.CreadoPor
      ]
    );

    return result.insertId;
  }

  async actualizar(id: number, descuento: Partial<Descuento>): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Descuentos SET
        Nombre = ?,
        Descripcion = ?,
        Tipo = ?,
        Valor = ?,
        FechaInicio = ?,
        FechaFin = ?,
        Activo = ?,
        MontoMinimo = ?,
        IdCategoriaAplica = ?,
        IdProductoAplica = ?,
        CodigoCupon = ?,
        UsosMaximos = ?
      WHERE IdDescuento = ?`,
      [
        descuento.Nombre,
        descuento.Descripcion || null,
        descuento.Tipo,
        descuento.Valor || null,
        descuento.FechaInicio,
        descuento.FechaFin,
        descuento.Activo,
        descuento.MontoMinimo,
        descuento.IdCategoriaAplica || null,
        descuento.IdProductoAplica || null,
        descuento.CodigoCupon || null,
        descuento.UsosMaximos || null,
        id
      ]
    );

    return result.affectedRows > 0;
  }

  async eliminar(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM Descuentos WHERE IdDescuento = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  async toggleActivo(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE Descuentos SET Activo = NOT Activo WHERE IdDescuento = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // ==================== VALIDACIÓN Y CÁLCULO ====================
  
  async validarCupon(codigo: string, montoCompra: number): Promise<{
    descuento: Descuento | null;
    valido: boolean;
    mensaje: string;
  }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'CALL sp_ValidarCupon(?, ?)',
      [codigo, montoCompra]
    );

    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      return {
        descuento: null,
        valido: false,
        mensaje: 'Cupón no encontrado'
      };
    }

    const row = rows[0][0];
    const estado = row.EstadoValidacion;

    if (estado !== 'VALIDO') {
      return {
        descuento: null,
        valido: false,
        mensaje: estado
      };
    }

    return {
      descuento: this.mapRowToDescuento(row),
      valido: true,
      mensaje: 'Cupón válido'
    };
  }

  // NUEVO: Calcular descuento para un item específico
  async calcularDescuentoItem(
    idDescuento: number,
    item: ItemCarrito
  ): Promise<number> {
    const descuento = await this.obtenerPorId(idDescuento);
    if (!descuento) return 0;

    let montoDescuento = 0;

    switch (descuento.Tipo) {
      case 'porcentaje':
        montoDescuento = (item.Subtotal * (descuento.Valor || 0)) / 100;
        break;

      case 'monto_fijo':
        montoDescuento = Math.min(descuento.Valor || 0, item.Subtotal);
        break;

      case '2x1':
        if (descuento.IdProductoAplica === item.IdProducto && item.Cantidad >= 2) {
          // Paga la mitad
          montoDescuento = item.Subtotal * 0.5;
        }
        break;

      case '3x2':
        if (descuento.IdProductoAplica === item.IdProducto && item.Cantidad >= 3) {
          // Por cada 3, 1 gratis
          const itemsGratis = Math.floor(item.Cantidad / 3);
          montoDescuento = itemsGratis * item.PrecioUnitario;
        }
        break;

      case 'combo':
        // Los combos se calculan a nivel de carrito completo
        montoDescuento = 0;
        break;
    }

    return Math.min(montoDescuento, item.Subtotal);
  }

  // NUEVO: Aplicar múltiples descuentos a un carrito
  async aplicarDescuentos(
    items: ItemCarrito[],
    codigosCupones: string[] = [],
    idUsuario?: number
  ): Promise<ResultadoDescuentos> {
    const subtotal = items.reduce((sum, item) => sum + item.Subtotal, 0);
    const descuentosAplicados: DescuentoAplicado[] = [];

    // 1. Obtener descuentos automáticos activos
    const descuentosAutomaticos = await this.obtenerDescuentosAplicables(items, subtotal);

    // 2. Validar cupones proporcionados
    for (const codigo of codigosCupones) {
      const validacion = await this.validarCupon(codigo, subtotal);
      if (validacion.valido && validacion.descuento) {
        descuentosAutomaticos.push(validacion.descuento);
      }
    }

    // 3. Ordenar por precedencia (específicos primero, luego generales)
    const descuentosOrdenados = this.ordenarPorPrecedencia(descuentosAutomaticos);

    // 4. Aplicar descuentos en orden
    let totalDescuento = 0;

    for (const descuento of descuentosOrdenados) {
      const resultado = await this.aplicarDescuentoIndividual(descuento, items, subtotal - totalDescuento);
      
      if (resultado.montoDescuento > 0) {
        descuentosAplicados.push(resultado);
        totalDescuento += resultado.montoDescuento;
      }

      // No aplicar más descuentos si ya se descuenta todo
      if (totalDescuento >= subtotal) break;
    }

    return {
      descuentosAplicados,
      subtotal,
      totalDescuento: Math.min(totalDescuento, subtotal),
      total: Math.max(0, subtotal - totalDescuento)
    };
  }

  // NUEVO: Obtener descuentos aplicables automáticamente
  private async obtenerDescuentosAplicables(
    items: ItemCarrito[],
    subtotal: number
  ): Promise<Descuento[]> {
    const descuentosActivos = await this.listarActivos();
    const aplicables: Descuento[] = [];

    for (const descuento of descuentosActivos) {
      // Verificar monto mínimo
      if (subtotal < descuento.MontoMinimo) continue;

      // Verificar si aplica a algún producto/categoría del carrito
      if (descuento.IdProductoAplica) {
        const tieneProducto = items.some(i => i.IdProducto === descuento.IdProductoAplica);
        if (tieneProducto) aplicables.push(descuento);
      } else if (descuento.IdCategoriaAplica) {
        const tieneCategoria = items.some(i => i.IdCategoria === descuento.IdCategoriaAplica);
        if (tieneCategoria) aplicables.push(descuento);
      } else if (!descuento.CodigoCupon) {
        // Descuento general (sin categoría/producto específico y sin cupón)
        aplicables.push(descuento);
      }
    }

    return aplicables;
  }

  // NUEVO: Ordenar descuentos por precedencia
  private ordenarPorPrecedencia(descuentos: Descuento[]): Descuento[] {
    return descuentos.sort((a, b) => {
      // 1. Promociones especiales (2x1, 3x2) primero
      const tipoOrdenA = ['2x1', '3x2', 'combo'].includes(a.Tipo) ? 0 : 1;
      const tipoOrdenB = ['2x1', '3x2', 'combo'].includes(b.Tipo) ? 0 : 1;
      if (tipoOrdenA !== tipoOrdenB) return tipoOrdenA - tipoOrdenB;

      // 2. Descuentos específicos antes que generales
      const especificidadA = a.IdProductoAplica ? 0 : a.IdCategoriaAplica ? 1 : 2;
      const especificidadB = b.IdProductoAplica ? 0 : b.IdCategoriaAplica ? 1 : 2;
      if (especificidadA !== especificidadB) return especificidadA - especificidadB;

      // 3. Mayor descuento primero
      const valorA = a.Tipo === 'porcentaje' ? (a.Valor || 0) : (a.Valor || 0) * 100;
      const valorB = b.Tipo === 'porcentaje' ? (b.Valor || 0) : (b.Valor || 0) * 100;
      return valorB - valorA;
    });
  }

  // NUEVO: Aplicar un descuento individual
  private async aplicarDescuentoIndividual(
    descuento: Descuento,
    items: ItemCarrito[],
    subtotalRestante: number
  ): Promise<DescuentoAplicado> {
    let montoDescuento = 0;
    const itemsAfectados: number[] = [];

    switch (descuento.Tipo) {
      case 'porcentaje':
        if (descuento.IdProductoAplica) {
          // Solo al producto específico
          const item = items.find(i => i.IdProducto === descuento.IdProductoAplica);
          if (item) {
            montoDescuento = (item.Subtotal * (descuento.Valor || 0)) / 100;
            itemsAfectados.push(item.IdProducto);
          }
        } else if (descuento.IdCategoriaAplica) {
          // Solo a la categoría
          const itemsCategoria = items.filter(i => i.IdCategoria === descuento.IdCategoriaAplica);
          const subtotalCategoria = itemsCategoria.reduce((sum, i) => sum + i.Subtotal, 0);
          montoDescuento = (subtotalCategoria * (descuento.Valor || 0)) / 100;
          itemsAfectados.push(...itemsCategoria.map(i => i.IdProducto));
        } else {
          // A todo el carrito
          montoDescuento = (subtotalRestante * (descuento.Valor || 0)) / 100;
          itemsAfectados.push(...items.map(i => i.IdProducto));
        }
        break;

      case 'monto_fijo':
        montoDescuento = Math.min(descuento.Valor || 0, subtotalRestante);
        itemsAfectados.push(...items.map(i => i.IdProducto));
        break;

      case '2x1':
        const item2x1 = items.find(i => i.IdProducto === descuento.IdProductoAplica);
        if (item2x1 && item2x1.Cantidad >= 2) {
          montoDescuento = item2x1.Subtotal * 0.5;
          itemsAfectados.push(item2x1.IdProducto);
        }
        break;

      case '3x2':
        const item3x2 = items.find(i => i.IdProducto === descuento.IdProductoAplica);
        if (item3x2 && item3x2.Cantidad >= 3) {
          const itemsGratis = Math.floor(item3x2.Cantidad / 3);
          montoDescuento = itemsGratis * item3x2.PrecioUnitario;
          itemsAfectados.push(item3x2.IdProducto);
        }
        break;
    }

    return {
      descuento,
      montoDescuento: Math.min(montoDescuento, subtotalRestante),
      descripcion: this.generarDescripcion(descuento, montoDescuento),
      itemsAfectados
    };
  }

  // NUEVO: Generar descripción legible del descuento
  private generarDescripcion(descuento: Descuento, monto: number): string {
    let desc = descuento.Nombre;
    
    if (descuento.Tipo === 'porcentaje') {
      desc += ` (-${descuento.Valor}%)`;
    } else if (descuento.Tipo === 'monto_fijo') {
      desc += ` (-$${descuento.Valor})`;
    }

    return `${desc}: -$${monto.toFixed(2)}`;
  }

  // ==================== REGISTRO Y ESTADÍSTICAS ====================
  
  async registrarUso(
    idDescuento: number,
    idVenta: number,
    montoDescuento: number
  ): Promise<void> {
    await pool.query(
      'CALL sp_RegistrarUsoDescuento(?, ?, ?)',
      [idDescuento, idVenta, montoDescuento]
    );
  }

  async obtenerPorVenta(idVenta: number): Promise<VentaDescuento[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        vd.*,
        d.Nombre AS DescuentoNombre,
        d.Tipo AS TipoDescuento
      FROM VentaDescuentos vd
      INNER JOIN Descuentos d ON vd.IdDescuento = d.IdDescuento
      WHERE vd.IdVenta = ?`,
      [idVenta]
    );

    return rows.map(row => ({
      IdVentaDescuento: row.IdVentaDescuento,
      IdVenta: row.IdVenta,
      IdDescuento: row.IdDescuento,
      MontoDescuento: parseFloat(row.MontoDescuento),
      TipoDescuento: row.TipoDescuento,
      DescripcionDescuento: row.DescripcionDescuento
    }));
  }

  async obtenerEstadisticas(): Promise<any> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) AS TotalDescuentos,
        SUM(CASE WHEN Activo = TRUE THEN 1 ELSE 0 END) AS Activos,
        SUM(CASE WHEN NOW() BETWEEN FechaInicio AND FechaFin THEN 1 ELSE 0 END) AS Vigentes,
        SUM(UsosActuales) AS UsosTotal,
        COALESCE((SELECT SUM(MontoDescuento) FROM VentaDescuentos), 0) AS AhorroTotal
      FROM Descuentos
    `);

    return rows[0];
  }

  // NUEVO: Top descuentos más usados
  async obtenerTopDescuentos(limite: number = 10): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        d.IdDescuento,
        d.Nombre,
        d.Tipo,
        COUNT(vd.IdVentaDescuento) AS VecesUsado,
        SUM(vd.MontoDescuento) AS AhorroTotal,
        AVG(vd.MontoDescuento) AS AhorroPromedio
      FROM Descuentos d
      INNER JOIN VentaDescuentos vd ON d.IdDescuento = vd.IdDescuento
      GROUP BY d.IdDescuento, d.Nombre, d.Tipo
      ORDER BY VecesUsado DESC
      LIMIT ?
    `, [limite]);

    return rows;
  }

  // ==================== HELPERS ====================
  
  private mapRowToDescuento(row: any): Descuento {
    return {
      IdDescuento: row.IdDescuento,
      Nombre: row.Nombre,
      Descripcion: row.Descripcion,
      Tipo: row.Tipo,
      Valor: row.Valor ? parseFloat(row.Valor) : undefined,
      FechaInicio: row.FechaInicio,
      FechaFin: row.FechaFin,
      Activo: Boolean(row.Activo),
      MontoMinimo: parseFloat(row.MontoMinimo),
      IdCategoriaAplica: row.IdCategoriaAplica,
      IdProductoAplica: row.IdProductoAplica,
      CodigoCupon: row.CodigoCupon,
      UsosMaximos: row.UsosMaximos,
      UsosActuales: row.UsosActuales || 0,
      ProductosCombo: row.ProductosCombo,
      CreadoPor: row.CreadoPor,
      FechaCreacion: row.FechaCreacion,
      CategoriaNombre: row.CategoriaNombre,
      ProductoNombre: row.ProductoNombre,
      DiasRestantes: row.DiasRestantes,
      PorcentajeUso: row.PorcentajeUso
    };
  }
}