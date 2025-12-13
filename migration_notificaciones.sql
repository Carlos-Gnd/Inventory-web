-- migration_notificaciones.sql
-- Sistema de Notificaciones para Smart Inventory

USE Smart_Inventory;

-- ========================================
-- TABLA DE NOTIFICACIONES
-- ========================================
CREATE TABLE IF NOT EXISTS Notificaciones (
    IdNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    Tipo ENUM('stock_bajo', 'stock_critico', 'venta', 'sistema', 'alerta') NOT NULL DEFAULT 'alerta',
    Titulo VARCHAR(200) NOT NULL,
    Mensaje TEXT NOT NULL,
    IdProducto INT NULL,
    IdUsuario INT NULL,
    Prioridad ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    Leida BOOLEAN DEFAULT FALSE,
    FechaCreacion DATETIME DEFAULT NOW(),
    FechaLeida DATETIME NULL,
    Icono VARCHAR(50) DEFAULT 'bell',
    Color VARCHAR(20) DEFAULT 'blue',
    Metadata JSON NULL,
    
    FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto) ON DELETE CASCADE,
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario) ON DELETE SET NULL,
    
    INDEX idx_leida (Leida),
    INDEX idx_fecha (FechaCreacion DESC),
    INDEX idx_tipo (Tipo),
    INDEX idx_prioridad (Prioridad),
    INDEX idx_usuario (IdUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- STORED PROCEDURE: Crear Notificación
-- ========================================
DELIMITER $$

CREATE PROCEDURE sp_CrearNotificacion(
    IN p_Tipo VARCHAR(20),
    IN p_Titulo VARCHAR(200),
    IN p_Mensaje TEXT,
    IN p_IdProducto INT,
    IN p_IdUsuario INT,
    IN p_Prioridad VARCHAR(10),
    IN p_Icono VARCHAR(50),
    IN p_Color VARCHAR(20)
)
BEGIN
    -- Evitar duplicados recientes (últimos 5 minutos)
    IF NOT EXISTS (
        SELECT 1 FROM Notificaciones
        WHERE Tipo = p_Tipo
          AND IdProducto = p_IdProducto
          AND Leida = FALSE
          AND FechaCreacion > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    ) THEN
        INSERT INTO Notificaciones (
            Tipo, Titulo, Mensaje, IdProducto, IdUsuario, 
            Prioridad, Icono, Color
        )
        VALUES (
            p_Tipo, p_Titulo, p_Mensaje, p_IdProducto, p_IdUsuario,
            p_Prioridad, p_Icono, p_Color
        );
    END IF;
END$$

-- ========================================
-- TRIGGER: Alerta de Stock Bajo
-- ========================================
CREATE TRIGGER trg_AlertaStockBajo
AFTER UPDATE ON Productos
FOR EACH ROW
BEGIN
    DECLARE v_Titulo VARCHAR(200);
    DECLARE v_Mensaje TEXT;
    DECLARE v_Prioridad VARCHAR(10);
    DECLARE v_Color VARCHAR(20);
    
    -- Solo si el stock disminuyó y está activo
    IF NEW.Estado = 1 AND NEW.Stock < OLD.Stock THEN
        
        -- Stock CRÍTICO (0 o negativo)
        IF NEW.Stock <= 0 THEN
            SET v_Titulo = CONCAT('⚠️ SIN STOCK: ', NEW.Nombre);
            SET v_Mensaje = CONCAT('El producto "', NEW.Nombre, '" se ha agotado. Stock actual: ', NEW.Stock);
            SET v_Prioridad = 'critica';
            SET v_Color = 'red';
            
            CALL sp_CrearNotificacion(
                'stock_critico', v_Titulo, v_Mensaje, NEW.IdProducto, 
                NULL, v_Prioridad, 'alert-triangle', v_Color
            );
        
        -- Stock BAJO (menor o igual al mínimo)
        ELSEIF NEW.Stock <= NEW.StockMinimo THEN
            SET v_Titulo = CONCAT('⚡ Stock Bajo: ', NEW.Nombre);
            SET v_Mensaje = CONCAT(
                'El producto "', NEW.Nombre, 
                '" tiene stock bajo. Actual: ', NEW.Stock, 
                ' | Mínimo: ', NEW.StockMinimo
            );
            SET v_Prioridad = 'alta';
            SET v_Color = 'orange';
            
            CALL sp_CrearNotificacion(
                'stock_bajo', v_Titulo, v_Mensaje, NEW.IdProducto, 
                NULL, v_Prioridad, 'package-x', v_Color
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- ========================================
-- GENERAR NOTIFICACIONES INICIALES
-- ========================================
-- Notificaciones para productos con stock bajo ACTUAL
INSERT INTO Notificaciones (Tipo, Titulo, Mensaje, IdProducto, Prioridad, Icono, Color)
SELECT 
    CASE 
        WHEN Stock <= 0 THEN 'stock_critico'
        ELSE 'stock_bajo'
    END AS Tipo,
    CONCAT(
        CASE 
            WHEN Stock <= 0 THEN '⚠️ SIN STOCK: '
            ELSE '⚡ Stock Bajo: '
        END,
        Nombre
    ) AS Titulo,
    CONCAT(
        'El producto "', Nombre, 
        '" tiene stock ', 
        CASE WHEN Stock <= 0 THEN 'agotado' ELSE 'bajo' END,
        '. Actual: ', Stock, 
        ' | Mínimo: ', StockMinimo
    ) AS Mensaje,
    IdProducto,
    CASE 
        WHEN Stock <= 0 THEN 'critica'
        ELSE 'alta'
    END AS Prioridad,
    CASE 
        WHEN Stock <= 0 THEN 'alert-triangle'
        ELSE 'package-x'
    END AS Icono,
    CASE 
        WHEN Stock <= 0 THEN 'red'
        ELSE 'orange'
    END AS Color
FROM Productos
WHERE Estado = 1 
  AND Stock <= StockMinimo;

-- ========================================
-- VISTAS ÚTILES
-- ========================================
-- Vista de notificaciones no leídas
CREATE OR REPLACE VIEW vw_NotificacionesNoLeidas AS
SELECT 
    n.IdNotificacion,
    n.Tipo,
    n.Titulo,
    n.Mensaje,
    n.Prioridad,
    n.Leida,
    n.FechaCreacion,
    n.Icono,
    n.Color,
    p.Nombre AS ProductoNombre,
    p.Stock AS ProductoStock,
    p.StockMinimo AS ProductoStockMinimo
FROM Notificaciones n
LEFT JOIN Productos p ON n.IdProducto = p.IdProducto
WHERE n.Leida = FALSE
ORDER BY 
    FIELD(n.Prioridad, 'critica', 'alta', 'media', 'baja'),
    n.FechaCreacion DESC;

-- ========================================
-- PROCEDIMIENTOS DE LIMPIEZA
-- ========================================
DELIMITER $$

-- Limpiar notificaciones antiguas (más de 30 días)
CREATE PROCEDURE sp_LimpiarNotificacionesAntiguas()
BEGIN
    DELETE FROM Notificaciones
    WHERE Leida = TRUE
      AND FechaLeida < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SELECT ROW_COUNT() AS NotificacionesEliminadas;
END$$

-- Marcar todas como leídas
CREATE PROCEDURE sp_MarcarTodasLeidas(IN p_IdUsuario INT)
BEGIN
    UPDATE Notificaciones
    SET Leida = TRUE,
        FechaLeida = NOW()
    WHERE Leida = FALSE
      AND (IdUsuario IS NULL OR IdUsuario = p_IdUsuario);
    
    SELECT ROW_COUNT() AS NotificacionesMarcadas;
END$$

DELIMITER ;

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT 
    COUNT(*) AS TotalNotificaciones,
    SUM(CASE WHEN Leida = FALSE THEN 1 ELSE 0 END) AS NoLeidas,
    SUM(CASE WHEN Prioridad = 'critica' THEN 1 ELSE 0 END) AS Criticas,
    SUM(CASE WHEN Prioridad = 'alta' THEN 1 ELSE 0 END) AS Altas
FROM Notificaciones;

SELECT * FROM vw_NotificacionesNoLeidas LIMIT 10;