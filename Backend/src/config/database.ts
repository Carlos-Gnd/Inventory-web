import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de conexión a MariaDB
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'Smart_Inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Función para verificar la conexión
export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MariaDB');
    console.log(`📦 Base de datos: ${process.env.DB_NAME || 'Smart_Inventory'}`);
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con MariaDB:', error);
    throw error;
  }
}

// Función para ejecutar el script de inicialización (si es necesario)
export async function initializeDatabase(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    
    // Verificar si las tablas existen
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'Usuarios'"
    );
    
    if (Array.isArray(tables) && tables.length === 0) {
      console.log('⚠️  Base de datos vacía. Ejecutando script de inicialización...');
      // Aquí podrías ejecutar el script SQL de inicialización
      // Por ahora, solo advertimos
      console.log('⚠️  Por favor, ejecuta el script Smart_Inventory_Script.sql manualmente');
    } else {
      console.log('✅ Tablas de base de datos encontradas');
    }
    
    connection.release();
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
  }
}