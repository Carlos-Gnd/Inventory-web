// Backend/src/repositories/notificacion.repository.ts
import { pool } from '../config/database';
import { Notificacion, EstadisticasNotificaciones } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class NotificacionRepository {
  
  // Listar notificaciones (con filtros opcionales)
  async listar(filtros?: {
    leida?: boolean;
    prioridad?: string;
    tipo?: string;
    limite?: number;
  }): Promise<Notificacion[]> {
    let query = `
      SELECT 
        n.IdNotificacion, n.Tipo, n.Titulo, n.Mensaje,
        n.IdProducto, n.IdUsuario, n.Prioridad, n.Leida,
        n.FechaCreacion, n.FechaLeida, n.Icono, n.Color,
        p.Nombre AS ProductoNombre,
        p.Stock AS ProductoStock,
        p.StockMinimo AS ProductoStockMinimo
      FROM Notificaciones n
      LEFT JOIN Productos p ON n.IdProducto = p.IdProducto
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filtros?.leida !== undefined) {
      query += ' AND n.Leida = ?';
      params.push(filtros.leida);
    }
    
    if (filtros?.prioridad) {
      query += ' AND n.Prioridad = ?';
      params.push(filtros.prioridad);
    }
    
    if (filtros?.tipo) {
      query += ' AND n.Tipo = ?';
      params.push(filtros.tipo);
    }
    
    query += `
      ORDER BY 
        FIELD(n.Prioridad, 'critica', 'alta', 'media', 'baja'),
        n.FechaCreacion DESC
    `;
    
    if (filtros?.limite) {
      query += ' LIMIT ?';
      params.push(filtros.limite);
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    return rows.map(row => ({
      IdNotificacion: row.IdNotificacion,
      Tipo: row.Tipo,
      Titulo: row.Titulo,
      Mensaje: row.Mensaje,
      IdProducto: row.IdProducto,
      IdUsuario: row.IdUsuario,
      Prioridad: row.Prioridad,
      Leida: Boolean(row.Leida),
      FechaCreacion: row.FechaCreacion,
      FechaLeida: row.FechaLeida,
      Icono: row.Icono,
      Color: row.Color,
      Producto: row.ProductoNombre ? {
        Nombre: row.ProductoNombre,
        Stock: row.ProductoStock,
        StockMinimo: row.ProductoStockMinimo
      } : undefined
    }));
  }
  
  // Obtener estadísticas
  async obtenerEstadisticas(): Promise<EstadisticasNotificaciones> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) AS TotalNotificaciones,
        SUM(CASE WHEN Leida = FALSE THEN 1 ELSE 0 END) AS NoLeidas,
        SUM(CASE WHEN Prioridad = 'critica' THEN 1 ELSE 0 END) AS Criticas,
        SUM(CASE WHEN Prioridad = 'alta' THEN 1 ELSE 0 END) AS Altas
      FROM Notificaciones
    `);
    
    return {
      TotalNotificaciones: rows[0].TotalNotificaciones || 0,
      NoLeidas: rows[0].NoLeidas || 0,
      Criticas: rows[0].Criticas || 0,
      Altas: rows[0].Altas || 0
    };
  }
  
  // Marcar como leída
  async marcarLeida(idNotificacion: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Notificaciones 
       SET Leida = TRUE, FechaLeida = NOW() 
       WHERE IdNotificacion = ?`,
      [idNotificacion]
    );
    return result.affectedRows > 0;
  }
  
  // Marcar todas como leídas
  async marcarTodasLeidas(idUsuario?: number): Promise<number> {
    let query = `UPDATE Notificaciones SET Leida = TRUE, FechaLeida = NOW() WHERE Leida = FALSE`;
    const params: any[] = [];
    
    if (idUsuario) {
      query += ' AND (IdUsuario IS NULL OR IdUsuario = ?)';
      params.push(idUsuario);
    }
    
    const [result] = await pool.query<ResultSetHeader>(query, params);
    return result.affectedRows;
  }
  
  // Eliminar notificación
  async eliminar(idNotificacion: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM Notificaciones WHERE IdNotificacion = ?',
      [idNotificacion]
    );
    return result.affectedRows > 0;
  }
  
  // Limpiar notificaciones antiguas (más de 30 días leídas)
  async limpiarAntiguas(): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(`
      DELETE FROM Notificaciones
      WHERE Leida = TRUE
        AND FechaLeida < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    return result.affectedRows;
  }
  
  // Crear notificación manual (opcional, para futuras features)
  async crear(notificacion: Omit<Notificacion, 'IdNotificacion'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Notificaciones 
       (Tipo, Titulo, Mensaje, IdProducto, IdUsuario, Prioridad, Icono, Color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notificacion.Tipo,
        notificacion.Titulo,
        notificacion.Mensaje,
        notificacion.IdProducto || null,
        notificacion.IdUsuario || null,
        notificacion.Prioridad,
        notificacion.Icono || 'bell',
        notificacion.Color || 'blue'
      ]
    );
    return result.insertId;
  }
}