    // backend/src/repositories/historialSesion.repository.ts
    import { pool } from '../config/database';
    import { HistorialSesion } from '../models';
    import { RowDataPacket, ResultSetHeader } from 'mysql2';

    export class HistorialSesionRepository {
    async registrar(sesion: HistorialSesion): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO HistorialSesiones 
        (IdUsuario, DireccionIP, Navegador, Dispositivo, SistemaOperativo, Exitoso, MotivoFallo)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            sesion.IdUsuario,
            sesion.DireccionIP,
            sesion.Navegador,
            sesion.Dispositivo,
            sesion.SistemaOperativo,
            sesion.Exitoso,
            sesion.MotivoFallo || null
        ]
        );
        return result.insertId;
    }

    async listar(limite: number = 100): Promise<HistorialSesion[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 
            hs.IdSesion, hs.IdUsuario, hs.FechaHora, hs.DireccionIP,
            hs.Navegador, hs.Dispositivo, hs.SistemaOperativo, hs.Exitoso, hs.MotivoFallo,
            CONCAT(u.Nombre, ' ', u.Apellido) as UsuarioNombre,
            u.Usuario as UsuarioUsername
        FROM HistorialSesiones hs
        INNER JOIN Usuarios u ON hs.IdUsuario = u.IdUsuario
        ORDER BY hs.FechaHora DESC
        LIMIT ?`,
        [limite]
        );

        return rows.map(row => ({
        IdSesion: row.IdSesion,
        IdUsuario: row.IdUsuario,
        FechaHora: row.FechaHora,
        DireccionIP: row.DireccionIP,
        Navegador: row.Navegador,
        Dispositivo: row.Dispositivo,
        SistemaOperativo: row.SistemaOperativo,
        Exitoso: Boolean(row.Exitoso),
        MotivoFallo: row.MotivoFallo,
        Usuario: {
            IdUsuario: row.IdUsuario,
            Nombre: row.UsuarioNombre,
            Apellido: '',
            UsuarioNombre: row.UsuarioUsername,
            IdRol: 0,
            Activo: true
        }
        }));
    }

    async listarPorUsuario(idUsuario: number, limite: number = 50): Promise<HistorialSesion[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 
            IdSesion, IdUsuario, FechaHora, DireccionIP,
            Navegador, Dispositivo, SistemaOperativo, Exitoso, MotivoFallo
        FROM HistorialSesiones
        WHERE IdUsuario = ?
        ORDER BY FechaHora DESC
        LIMIT ?`,
        [idUsuario, limite]
        );

        return rows.map(row => ({
        IdSesion: row.IdSesion,
        IdUsuario: row.IdUsuario,
        FechaHora: row.FechaHora,
        DireccionIP: row.DireccionIP,
        Navegador: row.Navegador,
        Dispositivo: row.Dispositivo,
        SistemaOperativo: row.SistemaOperativo,
        Exitoso: Boolean(row.Exitoso),
        MotivoFallo: row.MotivoFallo
        }));
    }

    async obtenerEstadisticas(idUsuario?: number): Promise<any> {
        const whereClause = idUsuario ? 'WHERE IdUsuario = ?' : '';
        const params = idUsuario ? [idUsuario] : [];

        const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 
            COUNT(*) as TotalSesiones,
            SUM(CASE WHEN Exitoso = 1 THEN 1 ELSE 0 END) as SesionesExitosas,
            SUM(CASE WHEN Exitoso = 0 THEN 1 ELSE 0 END) as SesionesFallidas,
            COUNT(DISTINCT DireccionIP) as IPsUnicas,
            MAX(FechaHora) as UltimoAcceso
        FROM HistorialSesiones
        ${whereClause}`,
        params
        );

        return rows[0];
    }
    }