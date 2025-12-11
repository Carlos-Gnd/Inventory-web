-- Script para agregar campos de perfil a la tabla Usuarios
-- Ejecuta esto en tu base de datos Smart_Inventory

USE Smart_Inventory;

-- Agregar nuevos campos a la tabla Usuarios
ALTER TABLE Usuarios
ADD COLUMN FotoPerfil LONGTEXT NULL COMMENT 'Foto en base64 o URL',
ADD COLUMN Telefono VARCHAR(20) NULL,
ADD COLUMN Email VARCHAR(100) NULL,
ADD COLUMN Direccion VARCHAR(255) NULL,
ADD COLUMN FechaNacimiento DATE NULL;

-- Verificar que los campos se agregaron correctamente
DESCRIBE Usuarios;

-- (Opcional) Actualizar algunos usuarios de prueba con datos de ejemplo
UPDATE Usuarios 
SET 
    Email = 'admin@smartinventory.com',
    Telefono = '7777-7777'
WHERE Usuario = 'admin';

UPDATE Usuarios 
SET 
    Email = 'cajero@smartinventory.com',
    Telefono = '7888-8888'
WHERE Usuario = 'cajero';

-- Verificar los cambios
SELECT IdUsuario, Nombre, Apellido, Usuario, Email, Telefono, FotoPerfil 
FROM Usuarios;