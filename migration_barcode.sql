-- migration_barcode.sql
-- Agregar campo de código de barras a la tabla Productos

USE Smart_Inventory;

-- Agregar columna CodigoBarras
ALTER TABLE Productos
ADD COLUMN CodigoBarras VARCHAR(50) NULL UNIQUE AFTER Nombre,
ADD INDEX idx_codigo_barras (CodigoBarras);

-- Función para generar código EAN-13 automático
DELIMITER $$

CREATE FUNCTION fn_GenerarCodigoBarras(p_IdProducto INT)
RETURNS VARCHAR(13)
DETERMINISTIC
BEGIN
    DECLARE v_Codigo VARCHAR(12);
    DECLARE v_CheckDigit INT;
    DECLARE v_Sum INT DEFAULT 0;
    DECLARE v_Pos INT DEFAULT 1;
    DECLARE v_Digit INT;
    
    -- Generar 12 dígitos base (prefijo 590 + IdProducto con padding)
    SET v_Codigo = LPAD(CONCAT('590', p_IdProducto), 12, '0');
    
    -- Calcular dígito verificador EAN-13
    WHILE v_Pos <= 12 DO
        SET v_Digit = CAST(SUBSTRING(v_Codigo, v_Pos, 1) AS UNSIGNED);
        
        IF v_Pos MOD 2 = 1 THEN
            SET v_Sum = v_Sum + v_Digit;
        ELSE
            SET v_Sum = v_Sum + (v_Digit * 3);
        END IF;
        
        SET v_Pos = v_Pos + 1;
    END WHILE;
    
    -- Calcular dígito de control
    SET v_CheckDigit = (10 - (v_Sum MOD 10)) MOD 10;
    
    -- Retornar código completo de 13 dígitos
    RETURN CONCAT(v_Codigo, v_CheckDigit);
END$$

DELIMITER ;

-- Procedimiento para actualizar productos existentes con códigos de barras
DELIMITER $$

CREATE PROCEDURE sp_GenerarCodigosBarrasProductos()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_IdProducto INT;
    DECLARE v_CodigoBarras VARCHAR(13);
    
    DECLARE cur CURSOR FOR 
        SELECT IdProducto 
        FROM Productos 
        WHERE CodigoBarras IS NULL;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_IdProducto;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Generar código de barras
        SET v_CodigoBarras = fn_GenerarCodigoBarras(v_IdProducto);
        
        -- Actualizar producto
        UPDATE Productos 
        SET CodigoBarras = v_CodigoBarras 
        WHERE IdProducto = v_IdProducto;
    END LOOP;
    
    CLOSE cur;
    
    SELECT CONCAT('✅ ', COUNT(*), ' códigos de barras generados') AS Resultado
    FROM Productos 
    WHERE CodigoBarras IS NOT NULL;
END$$

DELIMITER ;

-- Ejecutar procedimiento para productos existentes
CALL sp_GenerarCodigosBarrasProductos();

-- Trigger para generar código automáticamente en nuevos productos
DELIMITER $$

CREATE TRIGGER trg_GenerarCodigoBarras
BEFORE INSERT ON Productos
FOR EACH ROW
BEGIN
    IF NEW.CodigoBarras IS NULL OR NEW.CodigoBarras = '' THEN
        -- Obtener el próximo ID que se asignará
        SET @next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'Productos');
        
        -- Generar código de barras
        SET NEW.CodigoBarras = fn_GenerarCodigoBarras(@next_id);
    END IF;
END$$

DELIMITER ;

-- Verificar resultados
SELECT 
    IdProducto,
    Nombre,
    CodigoBarras,
    CASE 
        WHEN LENGTH(CodigoBarras) = 13 THEN '✅ Válido'
        ELSE '❌ Inválido'
    END AS Estado
FROM Productos
ORDER BY IdProducto;

-- Información del sistema
SELECT 
    COUNT(*) AS TotalProductos,
    COUNT(CodigoBarras) AS ConCodigoBarras,
    COUNT(*) - COUNT(CodigoBarras) AS SinCodigoBarras
FROM Productos;