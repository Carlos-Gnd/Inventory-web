# 🚀 Smart Inventory - Sistema de Gestión Web

Sistema moderno de inventario y ventas migrado de C# WinForms a stack web moderno.

---

## 📋 Stack Tecnológico

### **Backend**
- Node.js 18+
- Express.js
- TypeScript
- MariaDB 11.2
- JWT Authentication

### **Frontend**
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Vite (Build Tool)
- React Router
- Lucide Icons

---

## 🛠️ Instalación

### **Requisitos Previos**
- Node.js 18+ instalado
- Docker y Docker Compose (Opcional pero recomendado)
- MariaDB 11+ (si no usas Docker)

---

## 🐳 Opción 1: Instalación con Docker (Recomendado)

### **Paso 1: Clonar el repositorio**
```bash
git clone <tu-repo>
cd smart-inventory-web
```

### **Paso 2: Configurar variables de entorno**

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Editar .env si es necesario
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Verificar que VITE_API_URL=http://localhost:3000/api
```

### **Paso 3: Levantar todos los servicios**
```bash
# Desde la raíz del proyecto
docker-compose up -d --build
```

### **Paso 4: Verificar que todo esté funcionando**
```bash
# Ver logs
docker-compose logs -f

# Verificar servicios
docker-compose ps
```

**URLs de acceso:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

### **Credenciales por defecto:**
- **Admin:** `admin` / `admin123`
- **Cajero:** `cajero` / `cajero123`

---

## 💻 Opción 2: Instalación Manual (Sin Docker)

### **Paso 1: Instalar MariaDB**

**Crear la base de datos:**
```sql
CREATE DATABASE Smart_Inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smartuser'@'localhost' IDENTIFIED BY 'smart123';
GRANT ALL PRIVILEGES ON Smart_Inventory.* TO 'smartuser'@'localhost';
FLUSH PRIVILEGES;
```

**Ejecutar el script SQL:**
```bash
mysql -u smartuser -p Smart_Inventory < Smart_Inventory_Script.sql
```

### **Paso 2: Backend**

```bash
cd backend

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tu configuración de base de datos

# Modo desarrollo
npm run dev

# O compilar y ejecutar en producción
npm run build
npm start
```

### **Paso 3: Frontend**

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env

# Modo desarrollo
npm run dev

# O compilar para producción
npm run build
npm run preview
```

---

## 📦 Estructura del Proyecto

```
smart-inventory-web/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── models/
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── usuario.repository.ts
│   │   │   ├── categoria.repository.ts
│   │   │   ├── producto.repository.ts
│   │   │   └── venta.repository.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── usuario.routes.ts
│   │   │   ├── categoria.routes.ts
│   │   │   ├── producto.routes.ts
│   │   │   ├── venta.routes.ts
│   │   │   └── reporte.routes.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── utils/
│   │   │   └── auth.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── Smart_Inventory_Script.sql
├── docker-compose.yml
└── README.md
```

---

## 🔧 Comandos Útiles de Docker

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mariadb

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ Borra la BD)
docker-compose down -v

# Reconstruir imágenes
docker-compose build

# Reiniciar un servicio específico
docker-compose restart backend

# Ver estado de los servicios
docker-compose ps

# Ejecutar comandos dentro de un contenedor
docker-compose exec backend sh
docker-compose exec mariadb mysql -u root -p

# Ver uso de recursos
docker stats
```

---

## 🗄️ Comandos de Base de Datos

### **Acceder a MariaDB en Docker:**
```bash
docker-compose exec mariadb mysql -u root -p
# Password: admin123
```

### **Backup de la base de datos:**
```bash
docker-compose exec mariadb mysqldump -u root -padmin123 Smart_Inventory > backup.sql
```

### **Restaurar backup:**
```bash
docker-compose exec -T mariadb mysql -u root -padmin123 Smart_Inventory < backup.sql
```

---

## 🐛 Troubleshooting

### **Error: Puerto 3000 o 5173 ya en uso**
```bash
# Encontrar el proceso usando el puerto
lsof -ti:3000
lsof -ti:5173

# Matar el proceso
kill -9 <PID>

# O cambiar el puerto en docker-compose.yml o .env
```

### **Error: No se puede conectar a la base de datos**
```bash
# Verificar que MariaDB esté corriendo
docker-compose ps

# Ver logs de MariaDB
docker-compose logs mariadb

# Verificar conexión
docker-compose exec mariadb mysql -u smartuser -psmart123 -e "SHOW DATABASES;"
```

### **Error: CORS en el frontend**
Verificar que en `backend/.env`:
```bash
CORS_ORIGIN=http://localhost:5173
```

### **Error: Frontend no puede importar `import.meta.env`**
Asegúrate de que existe `frontend/src/vite-env.d.ts` con:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 📝 Funcionalidades

### **Módulo Administrador:**
- ✅ Gestión de Usuarios
- ✅ Gestión de Categorías
- ✅ Gestión de Productos
- ✅ Visualización de todas las Ventas
- ✅ Generación de Reportes (Excel/PDF)
- ✅ Dashboard con estadísticas

### **Módulo Cajero:**
- ✅ Registrar Ventas
- ✅ Ver Ventas Propias
- ✅ Generar Reportes Personales
- ✅ Dashboard personal

### **Características Generales:**
- ✅ Autenticación JWT
- ✅ Control de roles (Admin/Cajero)
- ✅ Búsqueda y filtros
- ✅ Exportación Excel/PDF
- ✅ Alertas de stock bajo
- ✅ Responsive design
- ✅ Notificaciones toast

---

## 🔐 Seguridad

- Contraseñas hasheadas con SHA256
- Autenticación basada en JWT
- Middleware de autorización
- Validación de datos en backend
- CORS configurado

---

## 🚀 Despliegue en Producción

### **Variables de entorno importantes:**

**Backend:**
```bash
NODE_ENV=production
JWT_SECRET=<generar-uno-seguro-aqui>
DB_HOST=<tu-host-de-bd>
DB_PASSWORD=<password-seguro>
CORS_ORIGIN=https://tu-dominio.com
```

**Frontend:**
```bash
VITE_API_URL=https://api.tu-dominio.com/api
```

### **Build de producción:**
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
# Los archivos estarán en frontend/dist/
```

---

## 📧 Soporte

Para preguntas o problemas, abre un issue en el repositorio.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 🎉 ¡Listo para usar!

Ahora tienes un sistema completo de inventario moderno. ¡Disfruta! 🚀