import { pool } from '../config/database';
import { Venta, DetalleVenta } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class VentaRepository {
  async registrarVenta(venta: Venta): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insertar venta
      const [ventaResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO Ventas (
            Fecha, IdUsuario, Subtotal, Descuento, Total, 
            MetodoPago, Comentario, Estado, FechaVenta
         ) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          venta.IdUsuario, 
          // Si el frontend no envía subtotal, calculamos revertiendo el total (fallback)
          venta.Subtotal || venta.Total, 
          venta.Descuento || 0, // Asegúrate que tu modelo Venta tenga este campo o mappedalo
          venta.Total, 
          venta.MetodoPago, 
          venta.Comentario || '', 
          venta.Estado ? '1' : '0'
        ]
      );
      const idVenta = ventaResult.insertId;

      // Insertar detalles de productos
      if (venta.DetallesVenta) {
        for (const detalle of venta.DetallesVenta) {
          await connection.query(
            `INSERT INTO DetalleVenta (IdVenta, IdProducto, Cantidad, PrecioUnitario, Subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [idVenta, detalle.IdProducto, detalle.Cantidad, detalle.PrecioUnitario, detalle.Subtotal]
          );
          // Actualizar stock...
          await connection.query(
            'UPDATE Productos SET Stock = Stock - ? WHERE IdProducto = ?',
            [detalle.Cantidad, detalle.IdProducto]
          );
        }
      }

      // Insertar historial de descuentos
      if (venta.DescuentosAplicados && venta.DescuentosAplicados.length > 0) {
        for (const desc of venta.DescuentosAplicados) {
           await connection.query(
             `INSERT INTO VentaDescuentos (IdVenta, IdDescuento, MontoDescuento, TipoDescuento, DescripcionDescuento)
              VALUES (?, ?, ?, ?, ?)`,
             [
                idVenta, 
                desc.IdDescuento, 
                desc.MontoDescuento, 
                desc.TipoDescuento, 
                desc.DescripcionDescuento || 'Descuento aplicado'
             ]
           );
           
           // Actualizar contador de usos
           await connection.query(
             'UPDATE Descuentos SET UsosActuales = UsosActuales + 1 WHERE IdDescuento = ?',
             [desc.IdDescuento]
           );
        }
      }

      await connection.commit();
      return idVenta;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async listar(): Promise<Venta[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT v.IdVenta, v.Fecha, v.IdUsuario,
              CONCAT(u.Nombre, ' ', u.Apellido) as NombreCompleto,
              v.Total, v.MetodoPago,
              IFNULL(v.Comentario, '') as Comentario,
              v.Estado, v.FechaVenta,
              IFNULL((SELECT SUM(dv.Cantidad) FROM DetalleVenta dv WHERE dv.IdVenta = v.IdVenta), 0) AS CantidadTotalProductos
       FROM Ventas v
       INNER JOIN Usuarios u ON v.IdUsuario = u.IdUsuario
       ORDER BY v.FechaVenta DESC`
    );

    return rows.map(row => ({
      IdVenta: row.IdVenta,
      Fecha: row.Fecha,
      IdUsuario: row.IdUsuario,
      Total: parseFloat(row.Total),
      MetodoPago: row.MetodoPago,
      Comentario: row.Comentario,
      Estado: row.Estado === '1' || row.Estado === 1 || row.Estado === true,
      FechaVenta: row.FechaVenta,
      CantidadTotalProductos: row.CantidadTotalProductos,
      Usuario: {
        IdUsuario: row.IdUsuario,
        Nombre: row.NombreCompleto,
        Apellido: '',
        UsuarioNombre: '',
        IdRol: 0,
        Activo: true
      }
    }));
  }

  async listarPorUsuario(idUsuario: number): Promise<Venta[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT v.IdVenta, v.Fecha, v.IdUsuario,
              CONCAT(u.Nombre, ' ', u.Apellido) as NombreCompleto,
              v.Total, v.MetodoPago,
              IFNULL(v.Comentario, '') as Comentario,
              v.Estado, v.FechaVenta,
              IFNULL((SELECT SUM(dv.Cantidad) FROM DetalleVenta dv WHERE dv.IdVenta = v.IdVenta), 0) AS CantidadTotalProductos
       FROM Ventas v
       INNER JOIN Usuarios u ON v.IdUsuario = u.IdUsuario
       WHERE v.IdUsuario = ?
       ORDER BY v.FechaVenta DESC`,
      [idUsuario]
    );

    return rows.map(row => ({
      IdVenta: row.IdVenta,
      Fecha: row.Fecha,
      IdUsuario: row.IdUsuario,
      Total: parseFloat(row.Total),
      MetodoPago: row.MetodoPago,
      Comentario: row.Comentario,
      Estado: row.Estado === '1' || row.Estado === 1 || row.Estado === true,
      FechaVenta: row.FechaVenta,
      CantidadTotalProductos: row.CantidadTotalProductos,
      Usuario: {
        IdUsuario: row.IdUsuario,
        Nombre: row.NombreCompleto,
        Apellido: '',
        UsuarioNombre: '',
        IdRol: 0,
        Activo: true
      }
    }));
  }

  async obtenerDetalleVenta(idVenta: number): Promise<DetalleVenta[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT dv.IdDetalle, dv.IdVenta, dv.IdProducto,
              p.Nombre as ProductoNombre, dv.Cantidad, dv.PrecioUnitario, dv.Subtotal
       FROM DetalleVenta dv
       INNER JOIN Productos p ON dv.IdProducto = p.IdProducto
       WHERE dv.IdVenta = ?`,
      [idVenta]
    );

    return rows.map(row => ({
      IdDetalle: row.IdDetalle,
      IdVenta: row.IdVenta,
      IdProducto: row.IdProducto,
      Cantidad: row.Cantidad,
      PrecioUnitario: parseFloat(row.PrecioUnitario),
      Subtotal: parseFloat(row.Subtotal),
      Producto: {
        IdProducto: row.IdProducto,
        Nombre: row.ProductoNombre,
        IdCategoria: 0,
        Precio: 0,
        Stock: 0,
        Estado: true,
        StockMinimo: 0,
        EsProductoFinal: true
      }
    }));
  }

  async listarPorFechas(fechaInicio: Date, fechaFin: Date): Promise<Venta[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT v.IdVenta, v.Fecha, v.IdUsuario,
              CONCAT(u.Nombre, ' ', u.Apellido) as NombreCompleto,
              v.Total, v.MetodoPago,
              IFNULL(v.Comentario, '') as Comentario,
              v.Estado, v.FechaVenta,
              IFNULL((SELECT SUM(dv.Cantidad) FROM DetalleVenta dv WHERE dv.IdVenta = v.IdVenta), 0) AS CantidadTotalProductos
       FROM Ventas v
       INNER JOIN Usuarios u ON v.IdUsuario = u.IdUsuario
       WHERE v.FechaVenta BETWEEN ? AND ?
       ORDER BY v.FechaVenta DESC`,
      [fechaInicio, fechaFin]
    );

    return rows.map(row => ({
      IdVenta: row.IdVenta,
      Fecha: row.Fecha,
      IdUsuario: row.IdUsuario,
      Total: parseFloat(row.Total),
      MetodoPago: row.MetodoPago,
      Comentario: row.Comentario,
      Estado: row.Estado === '1' || row.Estado === 1 || row.Estado === true,
      FechaVenta: row.FechaVenta,
      CantidadTotalProductos: row.CantidadTotalProductos,
      Usuario: {
        IdUsuario: row.IdUsuario,
        Nombre: row.NombreCompleto,
        Apellido: '',
        UsuarioNombre: '',
        IdRol: 0,
        Activo: true
      }
    }));
  }

  async verificarStock(idProducto: number, cantidad: number): Promise<{ disponible: boolean; mensaje: string }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT Stock, Nombre FROM Productos WHERE IdProducto = ?',
      [idProducto]
    );

    if (rows.length === 0) {
      return { disponible: false, mensaje: 'Producto no encontrado' };
    }

    const { Stock, Nombre } = rows[0];
    if (Stock >= cantidad) {
      return { disponible: true, mensaje: 'Stock disponible' };
    } else {
      return { disponible: false, mensaje: `Stock insuficiente para ${Nombre}. Disponible: ${Stock}` };
    }
  }
}