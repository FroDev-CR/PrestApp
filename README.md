# Presta+

Aplicación móvil para que prestamistas administren su cartera, cuotas, cobros y clientes. Incluye una vista de administración SaaS para gestionar tenants.

## Requisitos

- Node.js 20.9 o superior
- npm 10 o superior

## Desarrollo local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configura `ADMIN_EMAIL`, `ADMIN_PASSWORD` y un `AUTH_SECRET` aleatorio de al menos 32 caracteres en `.env.local`. La aplicación estará disponible en `http://localhost:3000`.

## Rutas

- `/`: inicio de sesión del administrador.
- `/admin`: centro de control de tenants.
- `/panel`: panel operativo para gestionar préstamos.

## Comprobaciones

```bash
npm run typecheck
npm run lint
npm run build
```

## Publicar en Vercel

El proyecto usa Next.js App Router y no requiere una configuración personalizada de compilación.

1. En Vercel, selecciona **Add New → Project**.
2. Importa el repositorio `FroDev-CR/PrestApp`.
3. Confirma que el preset detectado sea **Next.js**.
4. Deja vacío **Root Directory**.
5. Agrega `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `AUTH_SECRET` en **Environment Variables** para Producción, Preview y Desarrollo.
6. Selecciona **Deploy**.

Vercel utilizará automáticamente `npm install` y `npm run build`. Los siguientes pushes a `main` generarán nuevas versiones de producción.

## Estado actual

Esta versión no incluye datos de demostración. Los préstamos y tenants creados se guardan localmente en el navegador. El acceso administrativo usa una sesión firmada y una cookie segura; la base de datos y la separación persistente de datos por tenant se agregarán en una siguiente fase.
