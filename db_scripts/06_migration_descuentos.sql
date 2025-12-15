-- migration_descuentos.sql
-- Sistema de Descuentos y Promociones para Smart Inventory

USE Smart_Inventory;

-- ========================================
-- TABLA DE DESCUENTOS
-- ========================================
CREATE TABLE IF NOT EXISTS Descuentos (
    IdDescuento INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    Tipo ENUM('porcentaje', 'monto_fijo', '2x1', '3x2', 'combo') NOT NULL,
    Valor DECIMAL(10,2) NULL COMMENT 'Porcentaje (0-100) o Monto fijo',
    
    -- Vigencia
    FechaInicio DATETIME NOT NULL,
    FechaFin DATETIME NOT NULL,
    Activo BOOLEAN DEFAULT TRUE,
    
    -- Condiciones de aplicación
    MontoMinimo DECIMAL(10,2) DEFAULT 0 COMMENT 'Monto mínimo de compra',
    IdCategoriaAplica INT NULL COMMENT 'Aplica solo a esta categoría',
    IdProductoAplica INT NULL COMMENT 'Aplica solo a este producto',
    
    -- Cupones
    CodigoCupon VARCHAR(50) UNIQUE NULL COMMENT 'Código de cupón opcional',
    UsosMaximos INT DEFAULT NULL COMMENT 'NULL = ilimitado',
    UsosActuales INT DEFAULT 0,
    
    -- Combos (para tipo "combo")
    ProductosCombo JSON NULL COMMENT 'Array de {IdProducto, Cantidad, PrecioCombo}',
    
    -- Control
    CreadoPor INT NOT NULL,
    FechaCreacion DATETIME DEFAULT NOW(),
    
    FOREIGN KEY (IdCategoriaAplica) REFERENCES Categorias(IdCategoria) ON DELETE SET NULL,
    FOREIGN KEY (IdProductoAplica) REFERENCES Productos(IdProducto) ON DELETE SET NULL,
    FOREIGN KEY (CreadoPor) REFERENCES Usuarios(IdUsuario),
    
    INDEX idx_activo (Activo),
    INDEX idx_vigencia (FechaInicio, FechaFin),
    INDEX idx_codigo (CodigoCupon),
    INDEX idx_tipo (Tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA DE DESCUENTOS APLICADOS EN VENTAS
-- ========================================
CREATE TABLE IF NOT EXISTS VentaDescuentos (
    IdVentaDescuento INT AUTO_INCREMENT PRIMARY KEY,
    IdVenta INT NOT NULL,
    IdDescuento INT NOT NULL,
    MontoDescuento DECIMAL(10,2) NOT NULL,
    TipoDescuento VARCHAR(50) NOT NULL,
    DescripcionDescuento VARCHAR(255),
    
    FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta) ON DELETE CASCADE,
    FOREIGN KEY (IdDescuento) REFERENCES Descuentos(IdDescuento),
    
    INDEX idx_venta (IdVenta),
    INDEX idx_descuento (IdDescuento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- STORED PROCEDURES
-- ========================================

DELIMITER $$

-- Obtener descuentos activos y vigentes
CREATE PROCEDURE sp_ObtenerDescuentosActivos()
BEGIN
    SELECT 
        d.*,
        c.Nombre AS CategoriaNombre,
        p.Nombre AS ProductoNombre,
        CASE 
            WHEN d.UsosMaximos IS NULL THEN 'Ilimitado'
            ELSE CONCAT(d.UsosActuales, '/', d.UsosMaximos)
        END AS UsosInfo
    FROM Descuentos d
    LEFT JOIN Categorias c ON d.IdCategoriaAplica = c.IdCategoria
    LEFT JOIN Productos p ON d.IdProductoAplica = p.IdProducto
    WHERE d.Activo = TRUE
      AND NOW() BETWEEN d.FechaInicio AND d.FechaFin
      AND (d.UsosMaximos IS NULL OR d.UsosActuales < d.UsosMaximos)
    ORDER BY d.FechaCreacion DESC;
END$$

-- Validar cupón
CREATE PROCEDURE sp_ValidarCupon(
    IN p_Codigo VARCHAR(50),
    IN p_MontoCompra DECIMAL(10,2)
)
BEGIN
    SELECT 
        d.*,
        CASE 
            WHEN d.Activo = FALSE THEN 'Cupón inactivo'
            WHEN NOW() < d.FechaInicio THEN 'Cupón aún no vigente'
            WHEN NOW() > d.FechaFin THEN 'Cupón expirado'
            WHEN d.UsosMaximos IS NOT NULL AND d.UsosActuales >= d.UsosMaximos THEN 'Cupón agotado'
            WHEN p_MontoCompra < d.MontoMinimo THEN CONCAT('Compra mínima: $', d.MontoMinimo)
            ELSE 'VALIDO'
        END AS EstadoValidacion
    FROM Descuentos d
    WHERE d.CodigoCupon = p_Codigo;
END$$

-- Registrar uso de descuento
CREATE PROCEDURE sp_RegistrarUsoDescuento(
    IN p_IdDescuento INT,
    IN p_IdVenta INT,
    IN p_MontoDescuento DECIMAL(10,2)
)
BEGIN
    -- Incrementar contador de usos
    UPDATE Descuentos 
    SET UsosActuales = UsosActuales + 1
    WHERE IdDescuento = p_IdDescuento;
    
    -- Registrar en VentaDescuentos
    INSERT INTO VentaDescuentos (IdVenta, IdDescuento, MontoDescuento, TipoDescuento, DescripcionDescuento)
    SELECT 
        p_IdVenta,
        p_IdDescuento,
        p_MontoDescuento,
        d.Tipo,
        d.Nombre
    FROM Descuentos d
    WHERE d.IdDescuento = p_IdDescuento;
END$$

-- Calcular descuento aplicable
CREATE PROCEDURE sp_CalcularDescuento(
    IN p_IdDescuento INT,
    IN p_Subtotal DECIMAL(10,2),
    IN p_IdProducto INT,
    IN p_Cantidad INT
)
BEGIN
    DECLARE v_MontoDescuento DECIMAL(10,2) DEFAULT 0;
    DECLARE v_Tipo VARCHAR(20);
    DECLARE v_Valor DECIMAL(10,2);
    DECLARE v_ProductoAplica INT;
    
    SELECT Tipo, Valor, IdProductoAplica 
    INTO v_Tipo, v_Valor, v_ProductoAplica
    FROM Descuentos
    WHERE IdDescuento = p_IdDescuento;
    
    -- Calcular según tipo
    IF v_Tipo = 'porcentaje' THEN
        SET v_MontoDescuento = (p_Subtotal * v_Valor) / 100;
        
    ELSEIF v_Tipo = 'monto_fijo' THEN
        SET v_MontoDescuento = v_Valor;
        
    ELSEIF v_Tipo = '2x1' AND v_ProductoAplica = p_IdProducto THEN
        -- Descuento del 50% si compra 2 o más
        IF p_Cantidad >= 2 THEN
            SET v_MontoDescuento = p_Subtotal * 0.5;
        END IF;
        
    ELSEIF v_Tipo = '3x2' AND v_ProductoAplica = p_IdProducto THEN
        -- Por cada 3, el 3ro es gratis (33.33% descuento)
        IF p_Cantidad >= 3 THEN
            SET v_MontoDescuento = (p_Subtotal / p_Cantidad) * FLOOR(p_Cantidad / 3);
        END IF;
    END IF;
    
    -- No puede ser mayor al subtotal
    IF v_MontoDescuento > p_Subtotal THEN
        SET v_MontoDescuento = p_Subtotal;
    END IF;
    
    SELECT v_MontoDescuento AS MontoDescuento;
END$$

DELIMITER ;

-- ========================================
-- DATOS DE EJEMPLO
-- ========================================

-- Descuento por porcentaje (10% en todo)
INSERT INTO Descuentos (
    Nombre, Descripcion, Tipo, Valor,
    FechaInicio, FechaFin, MontoMinimo, CreadoPor
) VALUES (
    'Descuento 10% General',
    'Descuento del 10% en toda la tienda',
    'porcentaje',
    10.00,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    0.00,
    1
);

-- Cupón de $5 dólares
INSERT INTO Descuentos (
    Nombre, Descripcion, Tipo, Valor,
    FechaInicio, FechaFin, MontoMinimo,
    CodigoCupon, UsosMaximos, CreadoPor
) VALUES (
    'Cupón $5 OFF',
    'Cupón de $5 dólares de descuento',
    'monto_fijo',
    5.00,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 60 DAY),
    20.00,
    'AHORRA5',
    100,
    1
);

-- Promoción 2x1 en Brownies (IdProducto = 10)
INSERT INTO Descuentos (
    Nombre, Descripcion, Tipo,
    FechaInicio, FechaFin,
    IdProductoAplica, CreadoPor
) VALUES (
    '2x1 en Brownies',
    'Lleva 2 brownies al precio de 1',
    '2x1',
    NOW(),
    DATE_ADD(NOW(), INTERVAL 15 DAY),
    10, -- IdProducto del Brownie
    1
);

-- Descuento de cumpleaños (20% cupón único)
INSERT INTO Descuentos (
    Nombre, Descripcion, Tipo, Valor,
    FechaInicio, FechaFin,
    CodigoCupon, UsosMaximos, CreadoPor
) VALUES (
    'Cupón de Cumpleaños',
    '20% de descuento en tu cumpleaños',
    'porcentaje',
    20.00,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 365 DAY),
    'FELIZ2025',
    1,
    1
);

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista de descuentos activos con estadísticas
CREATE OR REPLACE VIEW vw_DescuentosActivos AS
SELECT 
    d.IdDescuento,
    d.Nombre,
    d.Descripcion,
    d.Tipo,
    d.Valor,
    d.FechaInicio,
    d.FechaFin,
    d.MontoMinimo,
    d.CodigoCupon,
    d.UsosMaximos,
    d.UsosActuales,
    CASE 
        WHEN d.UsosMaximos IS NULL THEN 'Ilimitado'
        ELSE CONCAT(ROUND((d.UsosActuales / d.UsosMaximos) * 100, 1), '%')
    END AS PorcentajeUso,
    c.Nombre AS CategoriaNombre,
    p.Nombre AS ProductoNombre,
    DATEDIFF(d.FechaFin, NOW()) AS DiasRestantes
FROM Descuentos d
LEFT JOIN Categorias c ON d.IdCategoriaAplica = c.IdCategoria
LEFT JOIN Productos p ON d.IdProductoAplica = p.IdProducto
WHERE d.Activo = TRUE
  AND NOW() BETWEEN d.FechaInicio AND d.FechaFin;

-- Vista de descuentos usados en ventas
CREATE OR REPLACE VIEW vw_DescuentosUsados AS
SELECT 
    vd.IdVentaDescuento,
    vd.IdVenta,
    v.FechaVenta,
    v.IdUsuario,
    CONCAT(u.Nombre, ' ', u.Apellido) AS Usuario,
    d.Nombre AS NombreDescuento,
    d.Tipo AS TipoDescuento,
    vd.MontoDescuento,
    v.Total AS TotalVenta
FROM VentaDescuentos vd
INNER JOIN Ventas v ON vd.IdVenta = v.IdVenta
INNER JOIN Descuentos d ON vd.IdDescuento = d.IdDescuento
INNER JOIN Usuarios u ON v.IdUsuario = u.IdUsuario
ORDER BY v.FechaVenta DESC;

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT 'TABLAS CREADAS:' AS Status;
SHOW TABLES LIKE '%Descuento%';

SELECT 'DESCUENTOS DE EJEMPLO:' AS Status;
SELECT * FROM vw_DescuentosActivos;

SELECT '✅ Migración de Descuentos completada exitosamente' AS Status;