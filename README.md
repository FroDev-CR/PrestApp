# Presta+

Aplicación móvil para que prestamistas administren su cartera, cuotas, cobros y clientes. Incluye una vista de administración SaaS para gestionar tenants.

## Requisitos

- Node.js 20.9 o superior
- npm 10 o superior

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

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
4. Deja vacíos **Root Directory** y **Environment Variables**.
5. Selecciona **Deploy**.

Vercel utilizará automáticamente `npm install` y `npm run build`. Los siguientes pushes a `main` generarán nuevas versiones de producción.

## Estado actual

Esta versión es un prototipo funcional de frontend con datos demostrativos. La persistencia, autenticación y separación real de datos por tenant se agregarán en una siguiente fase.
