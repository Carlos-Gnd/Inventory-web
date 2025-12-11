// Backend/src/repositories/producto.repository.ts

import { pool } from '../config/database';
import { Producto } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProductoRepository {
  async listar(): Promise<Producto[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.IdProducto, p.Nombre, p.CodigoBarras, p.IdCategoria, c.Nombre as CategoriaNombre,
              p.Precio, p.Stock, p.Estado, p.Descripcion, p.StockMinimo,
              p.FechaRegistro, p.EsProductoFinal
       FROM Productos p
       INNER JOIN Categorias c ON p.IdCategoria = c.IdCategoria`
    );

    return rows.map(row => ({
      IdProducto: row.IdProducto,
      Nombre: row.Nombre,
      CodigoBarras: row.CodigoBarras,
      IdCategoria: row.IdCategoria,
      Precio: parseFloat(row.Precio),
      Stock: row.Stock,
      Estado: Boolean(row.Estado),
      Descripcion: row.Descripcion,
      StockMinimo: row.StockMinimo,
      FechaRegistro: row.FechaRegistro,
      EsProductoFinal: Boolean(row.EsProductoFinal),
      Categoria: {
        IdCategoria: row.IdCategoria,
        Nombre: row.CategoriaNombre
      }
    }));
  }

  async registrar(producto: Producto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Productos (Nombre, CodigoBarras, IdCategoria, Precio, Stock, Estado,
                              Descripcion, StockMinimo, FechaRegistro, EsProductoFinal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        producto.Nombre,
        producto.CodigoBarras || null,
        producto.IdCategoria,
        producto.Precio,
        producto.Stock,
        producto.Estado,
        producto.Descripcion,
        producto.StockMinimo,
        producto.EsProductoFinal
      ]
    );

    return result.insertId;
  }

  async editar(producto: Producto): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Productos SET Nombre = ?, CodigoBarras = ?, IdCategoria = ?, Precio = ?, Stock = ?,
                           Estado = ?, Descripcion = ?, StockMinimo = ?, EsProductoFinal = ?
       WHERE IdProducto = ?`,
      [
        producto.Nombre,
        producto.CodigoBarras || null,
        producto.IdCategoria,
        producto.Precio,
        producto.Stock,
        producto.Estado,
        producto.Descripcion,
        producto.StockMinimo,
        producto.EsProductoFinal,
        producto.IdProducto
      ]
    );

    return result.affectedRows > 0;
  }

  async eliminar(idProducto: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE Productos SET Estado = 0 WHERE IdProducto = ?',
      [idProducto]
    );

    return result.affectedRows > 0;
  }

  async actualizarStock(idProducto: number, cantidad: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE Productos SET Stock = Stock - ? WHERE IdProducto = ?',
      [cantidad, idProducto]
    );

    return result.affectedRows > 0;
  }

  // Buscar por código de barras
  async buscarPorCodigo(codigoBarras: string): Promise<Producto | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.IdProducto, p.Nombre, p.CodigoBarras, p.IdCategoria, c.Nombre as CategoriaNombre,
              p.Precio, p.Stock, p.Estado, p.Descripcion, p.StockMinimo,
              p.FechaRegistro, p.EsProductoFinal
       FROM Productos p
       INNER JOIN Categorias c ON p.IdCategoria = c.IdCategoria
       WHERE p.CodigoBarras = ? AND p.Estado = 1`,
      [codigoBarras]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      IdProducto: row.IdProducto,
      Nombre: row.Nombre,
      CodigoBarras: row.CodigoBarras,
      IdCategoria: row.IdCategoria,
      Precio: parseFloat(row.Precio),
      Stock: row.Stock,
      Estado: Boolean(row.Estado),
      Descripcion: row.Descripcion,
      StockMinimo: row.StockMinimo,
      FechaRegistro: row.FechaRegistro,
      EsProductoFinal: Boolean(row.EsProductoFinal),
      Categoria: {
        IdCategoria: row.IdCategoria,
        Nombre: row.CategoriaNombre
      }
    };
  }
}