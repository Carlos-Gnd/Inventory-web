import { pool } from '../config/database';
import { Usuario } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UsuarioRepository {
  async listar(): Promise<Usuario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.IdUsuario, u.Nombre, u.Apellido, u.Usuario as UsuarioNombre,
              u.ClaveHash, u.IdRol, r.Rol as RolNombre, u.Activo, u.FechaRegistro
       FROM Usuarios u
       INNER JOIN Roles r ON u.IdRol = r.IdRol`
    );

    return rows.map(row => ({
      IdUsuario: row.IdUsuario,
      Nombre: row.Nombre,
      Apellido: row.Apellido,
      UsuarioNombre: row.UsuarioNombre,
      ClaveHash: row.ClaveHash,
      IdRol: row.IdRol,
      Activo: Boolean(row.Activo),
      FechaRegistro: row.FechaRegistro,
      Rol: {
        IdRol: row.IdRol,
        RolNombre: row.RolNombre
      }
    }));
  }

  async login(usuario: string, claveHash: string): Promise<Usuario | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.IdUsuario, u.Nombre, u.Apellido, u.Usuario as UsuarioNombre,
              u.ClaveHash, u.IdRol, r.Rol as RolNombre, u.Activo, u.FechaRegistro
       FROM Usuarios u
       INNER JOIN Roles r ON u.IdRol = r.IdRol
       WHERE u.Usuario = ? AND u.ClaveHash = ? AND u.Activo = 1`,
      [usuario, claveHash]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      IdUsuario: row.IdUsuario,
      Nombre: row.Nombre,
      Apellido: row.Apellido,
      UsuarioNombre: row.UsuarioNombre,
      ClaveHash: row.ClaveHash,
      IdRol: row.IdRol,
      Activo: Boolean(row.Activo),
      FechaRegistro: row.FechaRegistro,
      Rol: {
        IdRol: row.IdRol,
        RolNombre: row.RolNombre
      }
    };
  }

  async registrar(usuario: Usuario): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Usuarios (Nombre, Apellido, Usuario, ClaveHash, IdRol, Activo, FechaRegistro)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [usuario.Nombre, usuario.Apellido, usuario.UsuarioNombre, usuario.ClaveHash, usuario.IdRol, usuario.Activo]
    );
    return result.insertId;
  }

  async editar(usuario: Usuario): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Usuarios SET Nombre = ?, Apellido = ?, Usuario = ?, IdRol = ?, Activo = ?
       WHERE IdUsuario = ?`,
      [usuario.Nombre, usuario.Apellido, usuario.UsuarioNombre, usuario.IdRol, usuario.Activo, usuario.IdUsuario]
    );
    return result.affectedRows > 0;
  }

  async cambiarClave(idUsuario: number, nuevaClaveHash: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Usuarios SET ClaveHash = ? WHERE IdUsuario = ?`,
      [nuevaClaveHash, idUsuario]
    );
    return result.affectedRows > 0;
  }

  async eliminar(idUsuario: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Usuarios SET Activo = 0 WHERE IdUsuario = ?`,
      [idUsuario]
    );
    return result.affectedRows > 0;
  }
}