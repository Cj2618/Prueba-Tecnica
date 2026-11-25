# Sistema de Gestión de Solicitudes de Mantenimiento

Aplicación web para registrar, consultar y gestionar solicitudes de mantenimiento, implementada como prueba técnica para el cargo de Ingeniero/a de Desarrollo.

## 1. Tecnologías utilizadas

### Backend
- Next.js con App Router y Route Handlers.
- JavaScript.
- PostgreSQL.
- `pg` para la conexión con la base de datos.
- Jest para pruebas automatizadas.

### Frontend
- Vue 3.
- Vite.
- Axios para consumir la API REST.
- CSS para los estilos de la interfaz.

## 2. Arquitectura del proyecto

El proyecto está organizado en dos aplicaciones independientes:

```text
Prueba Tecnica/
│
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   └── api/
│   │   │       └── solicitudes/
│   │   │           ├── route.js
│   │   │           └── [id]/
│   │   │               ├── route.js
│   │   │               └── estado/
│   │   │                   └── route.js
│   │   └── lib/
│   │       ├── db.js
│   │       ├── solicitudes.js
│   │       └── solicitudes.test.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── jest.config.cjs
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.vue
    │   └── style.css
    └── package.json
```

El frontend consume los servicios REST expuestos por el backend. Este último gestiona las reglas de negocio y las operaciones sobre PostgreSQL.

## 3. Requisitos previos

Para ejecutar el proyecto se requiere:

- Node.js y npm.
- PostgreSQL.
- Una base de datos PostgreSQL disponible localmente.

## 4. Configuración de la base de datos

Crear una base de datos llamada:

```sql
CREATE DATABASE mantenimiento_db;
```

Ejecutar los scripts SQL incluidos en `backend/database/`:

1. `schema.sql`: crea la tabla de solicitudes y sus índices.
2. `seed.sql`: inserta registros de ejemplo para realizar pruebas.

La tabla principal es `solicitudes` y contiene información del título, descripción, prioridad, estado, solicitante, comentario de cierre y fechas de registro y actualización.

También se incluye una clave de idempotencia para controlar solicitudes de creación repetidas.

## 5. Configuración del backend

Ingresar a la carpeta:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo `.env.local`:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=mantenimiento_db
PGUSER=postgres
PGPASSWORD=tu_contraseña
```

No se deben compartir ni versionar las credenciales reales. Se proporciona un archivo `.env.example` como referencia.

Iniciar el servidor:

```bash
npm run dev
```

El backend estará disponible en:

`http://localhost:3000`

## 6. Configuración del frontend

Ingresar a la carpeta:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Iniciar la aplicación:

```bash
npm run dev
```

El frontend estará disponible en:

`http://localhost:5173`

La configuración del backend permite las solicitudes de origen del servidor de desarrollo de Vue.

## 7. Endpoints disponibles

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/solicitudes` | Crear solicitud |
| GET | `/api/solicitudes` | Consultar solicitudes |
| GET | `/api/solicitudes/:id` | Consultar detalle |
| PATCH | `/api/solicitudes/:id/estado` | Actualizar estado |

### Consulta de solicitudes

El endpoint GET permite aplicar filtros y paginación mediante parámetros:

```text
GET /api/solicitudes?estado=pendiente&prioridad=alta&page=1&per_page=10
```

### Creación de solicitudes

El endpoint POST recibe los datos del solicitante y de la solicitud.

Admite el encabezado opcional `Idempotency-Key`, que permite reconocer reintentos de una misma operación y evitar registros duplicados cuando se reutiliza la misma clave con los mismos datos.

Si la misma clave se utiliza con información diferente, se devuelve un conflicto HTTP 409.

### Actualización de estado

El endpoint PATCH permite actualizar el estado y, cuando corresponde, registrar un comentario de cierre.

## 8. Reglas de negocio

Se implementaron las siguientes restricciones:

- Una solicitud pendiente puede pasar a en proceso.
- Una solicitud en proceso puede regresar a pendiente.
- Una solicitud en proceso puede pasar a resuelta.
- Una solicitud resuelta no admite nuevas transiciones.
- No se permite pasar directamente de pendiente a resuelta.
- Las solicitudes de prioridad alta requieren un comentario de cierre de mínimo 10 caracteres para ser resueltas.

Las reglas se validan en el backend, independientemente de las restricciones presentadas en la interfaz.

## 9. Pruebas automatizadas

El proyecto utiliza Jest para verificar las validaciones y reglas de negocio.

Para ejecutar las pruebas:

```bash
cd backend
npm test
```

La suite incluye pruebas para:

- Validación de datos de solicitudes.
- Transiciones permitidas y no permitidas.
- Requisito de comentario de cierre para prioridad alta.
- Comportamiento del endpoint de consulta con filtros.

La prueba del endpoint GET utiliza un mock de PostgreSQL para aislar la lógica del controlador y verificar la construcción de consultas sin modificar la base de datos.

Adicionalmente, se realizaron pruebas manuales de los endpoints utilizando PostgreSQL real y Postman.

## 10. Decisiones técnicas

- **Separación frontend/backend:** permite mantener independientes la interfaz y la lógica de negocio.
- **PostgreSQL:** proporciona persistencia relacional y permite aplicar restricciones directamente en la base de datos.
- **Consultas parametrizadas:** evitan concatenar directamente valores recibidos del usuario en las consultas SQL.
- **Validaciones centralizadas:** las reglas de negocio se mantienen en el backend para evitar depender exclusivamente de la interfaz.
- **Idempotencia:** permite controlar reintentos en la creación de solicitudes.
- **Pruebas con mocks:** permiten evaluar componentes de forma aislada sin alterar los datos reales del entorno de desarrollo.

## 11. Posibles mejoras

- Implementar pruebas automatizadas de integración con una base de datos independiente.
- Incorporar autenticación y autorización por roles.
- Agregar registro de auditoría de cambios de estado.
- Incorporar filtros adicionales y búsqueda por texto.
- Implementar despliegue en un entorno de producción.

## 12. Uso de herramientas de inteligencia artificial

Se utilizaron herramientas de inteligencia artificial como apoyo durante el desarrollo para explorar alternativas de implementación, estructurar componentes, revisar validaciones y apoyar la elaboración de pruebas y documentación.

La implementación fue ejecutada y probada localmente, revisando el comportamiento de los endpoints, las reglas de negocio y la comunicación entre frontend y backend.