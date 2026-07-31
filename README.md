# Toguchi Ingeniería y Servicios S.A.C. — Landing Page

Monorepo del sitio web corporativo de **TOGUCHI INGENIERÍA Y SERVICIOS S.A.C.**
(RUC 20616012798), desplegado en [toguchi.com.pe](https://toguchi.com.pe) vía Cloudflare Workers.

## Stack

- [Astro 7+](https://astro.build)
- [Tailwind CSS 4+](https://tailwindcss.com)
- TypeScript
- npm workspaces (monorepo)

## Estructura

- `apps/landing/` — sitio principal (Astro)
- `packages/shared/` — componentes y assets compartidos (futuro)

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy

Deploy automático a Cloudflare Workers en cada push a `main`.

> Auto-deploy activo desde Cloudflare Workers (GitHub integration, 2026-07-31). Primer deploy manual verificado: Version ID `8a303594-c527-4db8-9f36-55c7661b58ce`.

## Licencia

Privado — TOGUCHI INGENIERÍA Y SERVICIOS S.A.C. Todos los derechos reservados.
