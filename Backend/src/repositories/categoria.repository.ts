import { pool } from '../config/database';
import { Categoria } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class CategoriaRepository {
  async listar(): Promise<Categoria[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT IdCategoria, Nombre, Descripcion FROM Categorias'
    );
    
    return rows.map(row => ({
      IdCategoria: row.IdCategoria,
      Nombre: row.Nombre,
      Descripcion: row.Descripcion
    }));
  }

  async registrar(categoria: Categoria): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Categorias (Nombre, Descripcion) 
       VALUES (?, ?)`,
      [categoria.Nombre, categoria.Descripcion]
    );
    return result.insertId;
  }

  async editar(categoria: Categoria): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Categorias 
       SET Nombre = ?, Descripcion = ? 
       WHERE IdCategoria = ?`,
      [categoria.Nombre, categoria.Descripcion, categoria.IdCategoria]
    );
    return result.affectedRows > 0;
  }

  async eliminar(idCategoria: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM Categorias WHERE IdCategoria = ?',
      [idCategoria]
    );
    return result.affectedRows > 0;
  }
}