// Backend/src/repositories/usuario.repository.ts

import { pool } from '../config/database';
import { Usuario } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UsuarioRepository {
  async listar(): Promise<Usuario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.IdUsuario, u.Nombre, u.Apellido, u.Usuario as UsuarioNombre,
              u.ClaveHash, u.IdRol, r.Rol as RolNombre, u.Activo, u.FechaRegistro,
              u.FotoPerfil, u.Telefono, u.Email, u.Direccion, u.FechaNacimiento
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
      FotoPerfil: row.FotoPerfil,
      Telefono: row.Telefono,
      Email: row.Email,
      Direccion: row.Direccion,
      FechaNacimiento: row.FechaNacimiento,
      Rol: {
        IdRol: row.IdRol,
        RolNombre: row.RolNombre
      }
    }));
  }

  async obtenerPorId(idUsuario: number): Promise<Usuario | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.IdUsuario, u.Nombre, u.Apellido, u.Usuario as UsuarioNombre,
              u.IdRol, r.Rol as RolNombre, u.Activo, u.FechaRegistro,
              u.FotoPerfil, u.Telefono, u.Email, u.Direccion, u.FechaNacimiento
       FROM Usuarios u
       INNER JOIN Roles r ON u.IdRol = r.IdRol
       WHERE u.IdUsuario = ?`,
      [idUsuario]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      IdUsuario: row.IdUsuario,
      Nombre: row.Nombre,
      Apellido: row.Apellido,
      UsuarioNombre: row.UsuarioNombre,
      IdRol: row.IdRol,
      Activo: Boolean(row.Activo),
      FechaRegistro: row.FechaRegistro,
      FotoPerfil: row.FotoPerfil,
      Telefono: row.Telefono,
      Email: row.Email,
      Direccion: row.Direccion,
      FechaNacimiento: row.FechaNacimiento,
      Rol: {
        IdRol: row.IdRol,
        RolNombre: row.RolNombre
      }
    };
  }

  async login(usuario: string, claveHash: string): Promise<Usuario | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.IdUsuario, u.Nombre, u.Apellido, u.Usuario as UsuarioNombre,
              u.ClaveHash, u.IdRol, r.Rol as RolNombre, u.Activo, u.FechaRegistro,
              u.FotoPerfil, u.Telefono, u.Email, u.Direccion, u.FechaNacimiento
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
      FotoPerfil: row.FotoPerfil,
      Telefono: row.Telefono,
      Email: row.Email,
      Direccion: row.Direccion,
      FechaNacimiento: row.FechaNacimiento,
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

  // Actualizar perfil del usuario
  async actualizarPerfil(idUsuario: number, datos: Partial<Usuario>): Promise<boolean> {
    const campos: string[] = [];
    const valores: any[] = [];

    if (datos.Nombre !== undefined) {
      campos.push('Nombre = ?');
      valores.push(datos.Nombre);
    }
    if (datos.Apellido !== undefined) {
      campos.push('Apellido = ?');
      valores.push(datos.Apellido);
    }
    if (datos.FotoPerfil !== undefined) {
      campos.push('FotoPerfil = ?');
      valores.push(datos.FotoPerfil);
    }
    if (datos.Telefono !== undefined) {
      campos.push('Telefono = ?');
      valores.push(datos.Telefono);
    }
    if (datos.Email !== undefined) {
      campos.push('Email = ?');
      valores.push(datos.Email);
    }
    if (datos.Direccion !== undefined) {
      campos.push('Direccion = ?');
      valores.push(datos.Direccion);
    }
    if (datos.FechaNacimiento !== undefined) {
      campos.push('FechaNacimiento = ?');
      valores.push(datos.FechaNacimiento);
    }

    if (campos.length === 0) return false;

    valores.push(idUsuario);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE Usuarios SET ${campos.join(', ')} WHERE IdUsuario = ?`,
      valores
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