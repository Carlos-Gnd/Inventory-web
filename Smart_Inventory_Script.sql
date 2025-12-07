-- Smart Inventory Database Script
USE Smart_Inventory;

-- ========================================
-- TABLAS
-- ========================================

-- Tabla Roles
CREATE TABLE IF NOT EXISTS Roles (
    IdRol INT AUTO_INCREMENT PRIMARY KEY,
    Rol VARCHAR(50) NOT NULL
);

-- Tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    IdUsuario INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100),
    Usuario VARCHAR(100) NOT NULL UNIQUE,
    ClaveHash VARCHAR(64),
    IdRol INT NOT NULL,
    Activo BIT DEFAULT 1,
    FechaRegistro DATETIME DEFAULT NOW(),
    FOREIGN KEY (IdRol) REFERENCES Roles(IdRol)
);

-- Tabla Categorias
CREATE TABLE IF NOT EXISTS Categorias (
    IdCategoria INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255)
);

-- Tabla Productos
CREATE TABLE IF NOT EXISTS Productos (
    IdProducto INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    IdCategoria INT NOT NULL,
    Precio DECIMAL(10, 2) NOT NULL,
    Stock INT NOT NULL,
    Estado BIT DEFAULT 1,
    Descripcion VARCHAR(255),
    StockMinimo INT DEFAULT 0,
    FechaRegistro DATETIME DEFAULT NOW(),
    EsProductoFinal BIT DEFAULT 0,
    FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria)
);

-- Tabla Ventas
CREATE TABLE IF NOT EXISTS Ventas (
    IdVenta INT AUTO_INCREMENT PRIMARY KEY,
    Fecha DATETIME DEFAULT NOW(),
    IdUsuario INT NOT NULL,
    Total DECIMAL(10, 2) NOT NULL,
    MetodoPago VARCHAR(50),
    Comentario VARCHAR(255),
    Estado VARCHAR(20) DEFAULT 'Activo',
    FechaVenta DATETIME DEFAULT NOW(),
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);

-- Tabla DetalleVenta
CREATE TABLE IF NOT EXISTS DetalleVenta (
    IdDetalle INT AUTO_INCREMENT PRIMARY KEY,
    IdVenta INT NOT NULL,
    IdProducto INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10, 2) NOT NULL,
    Subtotal DECIMAL(18, 2),
    FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta),
    FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto)
);

-- Tabla Reportes
CREATE TABLE IF NOT EXISTS Reportes (
    IdReporte INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL,
    TipoReporte VARCHAR(100),
    FechaGeneracion DATETIME DEFAULT NOW(),
    RutaArchivo VARCHAR(255),
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);

-- ========================================
-- DATOS INICIALES
-- ========================================

-- Roles
INSERT INTO Roles (Rol) VALUES ('Admin');
INSERT INTO Roles (Rol) VALUES ('Cajero');

-- Usuarios (contraseñas hasheadas con SHA256)
-- admin / admin123
INSERT INTO Usuarios (Nombre, Apellido, Usuario, ClaveHash, IdRol, Activo, FechaRegistro) 
VALUES ('Admin', 'System', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 1, NOW());

-- cajero / cajero123
INSERT INTO Usuarios (Nombre, Apellido, Usuario, ClaveHash, IdRol, Activo, FechaRegistro) 
VALUES ('Cajero', 'Principal', 'cajero', '1ed4353e845e2e537e017c0fac3a0d402d231809b7989e90da15191c1148a93f', 2, 1, NOW());

-- Categorías
INSERT INTO Categorias (Nombre, Descripcion) VALUES 
('Pasteles', 'Pasteles enteros y por rebanada'),
('Postres', 'Postres individuales y porciones'),
('Panes', 'Panes dulces y salados'),
('Bebidas', 'Bebidas frías y calientes'),
('Galletas', 'Galletas y productos horneados pequeños'),
('Decoración', 'Artículos para decorar pasteles');

-- Productos
INSERT INTO Productos (Nombre, IdCategoria, Precio, Stock, Estado, Descripcion, StockMinimo, FechaRegistro, EsProductoFinal) VALUES
('Pastel de Chocolate', 1, 350.00, 5, 1, 'Pastel de chocolate de 1kg', 2, NOW(), 1),
('Pastel de Vainilla', 1, 40.00, 4, 1, 'Pastel de vainilla de 1kg', 2, NOW(), 1),
('Pastel Tres Leches', 1, 28.99, 4, 1, 'Pastel tres leches de 1kg', 2, NOW(), 1),
('Pastel Red Velvet', 1, 42.00, 2, 1, 'Pastel red velvet con queso crema', 2, NOW(), 1),
('Pastel Zanahoria', 1, 36.00, 4, 1, 'Pastel de zanahoria con nuez', 2, NOW(), 1),
('Flan Napolitano', 2, 5.00, 17, 1, 'Flan individual', 5, NOW(), 1),
('Gelatina', 2, 2.75, 30, 1, 'Gelatina de sabores', 10, NOW(), 1),
('Tiramisú', 2, 4.30, 15, 1, 'Tiramisú individual', 5, NOW(), 1),
('Cheesecake', 2, 6.00, 8, 1, 'Rebanada de cheesecake', 5, NOW(), 1),
('Brownie', 2, 7.50, 20, 1, 'Brownie de chocolate', 8, NOW(), 1),
('Concha', 3, 2.00, 50, 1, 'Pan dulce concha', 20, NOW(), 1),
('Cuernito', 3, 3.00, 40, 1, 'Cuernito de mantequilla', 15, NOW(), 1),
('Dona Glaseada', 3, 3.50, 35, 1, 'Dona con glaseado', 15, NOW(), 1),
('Pan de Elote', 3, 3.00, 20, 1, 'Rebanada de pan de elote', 10, NOW(), 1),
('Muffin', 3, 1.75, 30, 1, 'Muffin de arándano', 10, NOW(), 1),
('Café Americano', 4, 7.00, 100, 1, 'Café americano caliente', 20, NOW(), 1),
('Café Latte', 4, 7.00, 100, 1, 'Café latte', 20, NOW(), 1),
('Chocolate Caliente', 4, 6.50, 100, 1, 'Chocolate caliente', 20, NOW(), 1),
('Jugo Natural', 4, 6.75, 50, 1, 'Jugo de naranja', 15, NOW(), 1),
('Refresco', 4, 5.70, 80, 1, 'Refresco en lata', 30, NOW(), 1),
('Galletas Chocochips', 5, 2.40, 25, 1, 'Paquete de 6 galletas', 10, NOW(), 1),
('Galletas de Avena', 5, 3.99, 25, 1, 'Paquete de 6 galletas', 10, NOW(), 1),
('Macarrones', 5, 5.50, 20, 1, 'Caja de 4 macarrones', 8, NOW(), 1),
('Polvorones', 5, 2.00, 30, 1, 'Paquete de 6 polvorones', 10, NOW(), 1),
('Velas Números', 6, 5.60, 50, 1, 'Velas para cumpleaños', 20, NOW(), 1),
('Velas Tradicionales', 6, 2.85, 60, 1, 'Paquete de 12 velas', 25, NOW(), 1),
('Topper Felicidades', 6, 9.00, 30, 1, 'Decoración para pastel', 10, NOW(), 1),
('Topper Cumpleaños', 6, 25.00, 30, 1, 'Decoración para pastel', 10, NOW(), 1);

-- ========================================
-- STORED PROCEDURES
-- ========================================

DELIMITER $$

CREATE PROCEDURE sp_LoginUsuario(
    IN p_Usuario NVARCHAR(50),
    IN p_ClaveHash NVARCHAR(256)
)
BEGIN
    SELECT 
        u.IdUsuario, u.Nombre, u.Apellido, u.Usuario AS UsuarioNombre,
        u.ClaveHash, u.IdRol, u.Activo, u.FechaRegistro,
        r.IdRol AS Rol_IdRol, r.Rol AS Rol_Nombre
    FROM Usuarios u
    INNER JOIN Roles r ON r.IdRol = u.IdRol
    WHERE u.Usuario = p_Usuario
      AND u.ClaveHash = p_ClaveHash
      AND u.Activo = 1;
END$$

CREATE PROCEDURE sp_RegistrarUsuario(
    IN p_Nombre VARCHAR(100),
    IN p_Apellido VARCHAR(100),
    IN p_Usuario VARCHAR(100),
    IN p_Clave NVARCHAR(200),
    IN p_IdRol INT
)
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Usuario, ClaveHash, IdRol)
    VALUES (
        p_Nombre,
        p_Apellido,
        p_Usuario,
        SHA2(p_Clave, 256),
        p_IdRol
    );
END$$

DELIMITER ;