This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Auditoría y Mejoras Responsivas
Resumen de los cambios implementados para adaptar el diseño a dispositivos móviles (375px) y tablets (768px), priorizando la experiencia desktop original.

| Prioridad | Hallazgo | Solución |
| :--- | :--- | :--- |
| **Crítica** | Sidebar bloqueaba pantalla en mobile | Implementada `hidden md:flex` + Navegación inferior fija en mobile. |
| **Crítica** | Contenedores `min-w-[340px]` causaban desbordamiento | `flex-wrap` eliminado, `flex-col` + `min-w-0` y `w-full` en mobile. |
| **Crítica** | Tablas de datos (Bolsa/Crypto/Cartera) overflow horizontal | Columnas secundarias ocultas (`hidden sm:table-cell`). |
| **Importante** | Panel de detalle desbordaba / z-index incorrecto | `w-full` en mobile, z-index ajustado sobre navegación. |
| **Importante** | Alturas `100vh` causaban recortes de interfaz | Uso de `100svh`/`100dvh` y `viewport-fit=cover`. |
| **Importante** | Inputs <16px activaban zoom automático en iOS | Regla global de `font-size: 16px` en mobile para inputs/selects. |
| **Menor** | Cards de activos, países y gráficos | Grid responsivo (`grid-cols-1 sm:grid-cols-2`), padding y fuentes ajustadas. |

