# FinDash 📈
Tu terminal financiera, desktop-first, sin dramas.

FinDash es una terminal diseñada para seguir mercados, activos y noticias en tiempo real. ¿La mejor parte? No necesitás configurar ninguna API Key ni pagar una suscripción para obtener datos de calidad.

## ¿Qué tiene bajo el capó? 🛠️

*   **Framework:** Next.js (App Router + TypeScript)
*   **Estilos:** Tailwind CSS v4
*   **Data Engine:** Yahoo Finance (Acciones/ETFs) + Binance (WebSocket Real-time + Historial 10 años)
*   **Noticias:** Agregador RSS con análisis de sentimiento automático (Buenas/Malas)
*   **Gráficos:** Lightweight Charts v5 (Zoom por selección, Watermarks, Leyendas dinámicas)
*   **UI/UX:** Atajos de teclado (1-7), modo Responsivo (Mobile-first), tema Dark fluido.

## ¿Cómo usarlo? 🚀

1.  **Cloná el repo:**
    ```bash
    git clone https://github.com/VitoLattanzi/findash.git
    cd findash
    ```
2.  **Instalá todo:**
    ```bash
    npm install
    ```
3.  **¡Despegá!:**
    ```bash
    npm run dev
    ```
    *Abrí [http://localhost:3000](http://localhost:3000) y empezá a tradear.*

---

## Auditoría y Mejoras Responsivas
Resumen de los cambios implementados para adaptar el diseño a dispositivos móviles (375px) y tablets (768px), priorizando la experiencia desktop original.

| Prioridad | Hallazgo | Solución |
| :--- | :--- | :--- |
| **Crítica** | Sidebar bloqueaba pantalla en mobile | Implementada `hidden md:flex` + Navegación inferior fija en mobile. |
| **Crítica** | Contenedores `min-w-[340px]` causaban desbordamiento | `flex-wrap` eliminado, `flex-col` + `min-w-0` y `w-full` en mobile. |
| **Crítica** | Tablas de datos (Bolsa/Crypto/Cartera) overflow horizontal | Columnas secundarias ocultas (`hidden sm:table-cell`). |
| **Importante** | Panel de detalle desbordaba / z-index incorrecto | `w-full` en mobile, z-index ajustado sobre navegación. |
| **Importante** | Alturas `100vh` causaban recortes de interfaz | Uso de `100svh`/`100dvh` y `viewport-fit=cover`. |
| **Importante** | Inputs <16px causaban zoom automático en iOS | Regla global de `font-size: 16px` en mobile para inputs/selects. |
| **Menor** | Cards de activos, países y gráficos | Grid responsivo (`grid-cols-1 sm:grid-cols-2`), padding y fuentes ajustadas. |
