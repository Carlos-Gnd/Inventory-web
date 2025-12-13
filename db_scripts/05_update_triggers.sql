-- update_trigger_with_email.sql
-- Actualizar trigger para que el backend sepa que debe enviar email

USE Smart_Inventory;

-- Primero eliminamos el trigger existente
DROP TRIGGER IF EXISTS trg_AlertaStockBajo;

DELIMITER $$

-- Recrear trigger mejorado
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
            SET v_Mensaje = CONCAT('El producto "', NEW.Nombre, '" se ha agotado completamente. Stock actual: ', NEW.Stock);
            SET v_Prioridad = 'critica';
            SET v_Color = 'red';
            
            -- Insertar notificación crítica
            INSERT INTO Notificaciones (
                Tipo, Titulo, Mensaje, IdProducto, 
                Prioridad, Icono, Color,
                Metadata
            ) VALUES (
                'stock_critico', v_Titulo, v_Mensaje, NEW.IdProducto,
                v_Prioridad, 'alert-triangle', v_Color,
                JSON_OBJECT('email_enviado', FALSE, 'requiere_email', TRUE)
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
            
            -- Insertar notificación de stock bajo
            INSERT INTO Notificaciones (
                Tipo, Titulo, Mensaje, IdProducto, 
                Prioridad, Icono, Color,
                Metadata
            ) VALUES (
                'stock_bajo', v_Titulo, v_Mensaje, NEW.IdProducto,
                v_Prioridad, 'package-x', v_Color,
                JSON_OBJECT('email_enviado', FALSE, 'requiere_email', TRUE)
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- Agregar campo para tracking de emails enviados
ALTER TABLE Notificaciones 
ADD COLUMN EmailEnviado BOOLEAN DEFAULT FALSE AFTER Leida,
ADD INDEX idx_email_enviado (EmailEnviado);

-- Actualizar notificaciones existentes
UPDATE Notificaciones SET EmailEnviado = FALSE WHERE EmailEnviado IS NULL;

SELECT '✅ Trigger actualizado con soporte para emails' AS Status;