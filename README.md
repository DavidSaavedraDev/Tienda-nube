# NubeTech

Tienda web de tecnología construida con Node.js y Express. Incluye catálogo, búsqueda, filtros, carrito de compras, checkout simulado y administración local de productos.

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
├── public/index.html    # Interfaz principal
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
- Diseño responsive para escritorio y móvil.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/products` | Lista todos los productos |
| `POST` | `/api/products` | Agrega un producto |
| `DELETE` | `/api/products/:id` | Elimina un producto |
| `POST` | `/api/orders` | Registra un pedido simulado |

> Los pagos son simulados. Para producción se debe integrar una pasarela como Mercado Pago, Stripe o PayU, además de autenticación y una base de datos real.
