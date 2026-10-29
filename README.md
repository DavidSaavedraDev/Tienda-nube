# NubeTech

Tienda web de tecnología construida con Node.js y Express. Incluye catálogo, búsqueda, filtros, carrito, checkout simulado y autenticación básica con roles.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

```bash
npm install
```

## Ejecución

Modo normal:

```bash
npm start
```

Modo desarrollo, con reinicio automático:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura

```text
.
├── data/products.json   # Catálogo local
├── data/users.json      # Usuarios demo con hashes scrypt
├── public/index.html    # Interfaz principal
├── public/auth.css      # Estilos de autenticación
├── public/styles.css    # Diseño responsive
├── public/app.js        # Catálogo, carrito y checkout
└── server.js            # API y servidor Express
```

## Funcionalidades

- Catálogo de productos tecnológicos.
- Búsqueda por nombre y descripción.
- Filtro por categoría.
- Carrito con cantidades y total.
- Checkout simulado con número de pedido.
- Agregar y eliminar productos desde la sección de administración.
- Inicio de sesión con roles `admin` y `cliente`.
- Contraseñas almacenadas como hashes `scrypt`, nunca en texto plano.
- Rutas de modificación del catálogo protegidas en el servidor.
- Diseño responsive para escritorio y móvil.

## Usuarios de demostración

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin` | `Admin123!` |
| Cliente | `cliente` | `Cliente123!` |

Estas credenciales son únicamente para desarrollo local. Cámbialas antes de publicar la aplicación.

## Alcance de la autenticación

Las sesiones duran 8 horas, se almacenan en memoria y usan una cookie `HttpOnly` con `SameSite=Lax`. El servidor protege `POST /api/products` y `DELETE /api/products/:id`: solo un usuario autenticado con rol `admin` puede ejecutarlas. El cliente puede consultar el catálogo y realizar pedidos simulados.

Para producción se debe migrar la sesión y los usuarios a una base de datos, usar HTTPS, secretos mediante variables de entorno, rotación de credenciales, limitación de intentos y una solución de sesiones compartida.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/products` | Lista todos los productos |
| `POST` | `/api/auth/login` | Inicia sesión |
| `GET` | `/api/auth/me` | Consulta la sesión actual |
| `POST` | `/api/auth/logout` | Cierra sesión |
| `POST` | `/api/products` | Agrega un producto (solo `admin`) |
| `DELETE` | `/api/products/:id` | Elimina un producto (solo `admin`) |
| `POST` | `/api/orders` | Registra un pedido simulado |

> Los pagos y pedidos son simulados. Para producción se debe integrar una pasarela como Mercado Pago, Stripe o PayU y una base de datos real.
