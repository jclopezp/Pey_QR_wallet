# BuzzQR — Landing v0.4

Landing pública basada en el **PRD v0.3** y **BuzzQR Brand Book v0.3** (paleta «Azul Confianza»).

## Iniciar en VS Code

```bash
npm install
npm run dev
```

Abre la URL local que muestra Vite. Para comprobar producción: `npm run build` y `npm run preview`.

## Qué incluye

- Frontend en React + TypeScript + Vite, sin llamadas al backend.
- Portada, 3 pasos, 4 beneficios, transparencia del flujo CoDi y CTA final.
- Selector **ES / EN** con diccionarios separados en `src/i18n` y preferencia persistente.
- Modo claro/oscuro con variables CSS en `src/styles.css` y preferencia persistente.
- Previsualización móvil de Wallet, QR **de ejemplo no válido para pagar**, animación suave y botón para mostrar un aviso de pago **simulado**.
- Rutas públicas `/`, `/signup`, `/login` con pantallas informativas. **No hay registro ni autenticación real:** no se solicitan contraseñas.
- Navegación móvil, enlace «saltar al contenido», roles y etiquetas accesibles, foco visible y soporte `prefers-reduced-motion`.

## Preparación para integración con tu monorepo

Copiar `src` a `apps/web/src` o integrar `App` como ruta `/`. Reemplazar las pantallas provisionales `/signup` y `/login` con autenticación segura; proteger `/app` por sesión. El nombre está en una sola constante: `src/config.ts`. Las cadenas están en `src/i18n/es.ts` y `src/i18n/en.ts`.

## Marcas de terceros

El bloque de «Infraestructura de cobro» carga los **logotipos oficiales combinados de Pey y CoDi** desde `https://docs.pey.mx/img/design/pey_codi_light.svg` y enlaza las [reglas de marca de Pey](https://docs.pey.mx/brand-assets/). Para uso sin conexión, descarga los activos originales desde la fuente oficial y actualiza `PEY_BRAND_ASSET`. No recrees ni alteres esos logotipos.

## Importante

La landing es un **prototipo visual**. No genera QR de pago reales, no procesa dinero, no crea cuentas y no integra Wallet. Evita usarla como servicio de cobros en producción sin backend, verificación de webhooks y validaciones correspondientes.

Los umbrales de Lighthouse y accesibilidad del Brand Book son **objetivos pendientes de auditoría**, no certificados alcanzados.

Cambios v0.3: marca BuzzQR con pictograma QR, sin punto; el scroll de las secciones y las rutas de autenticación se controlan por separado.

Cambios v0.4: los logotipos oficiales combinados de pey y CoDi aparecen ahora en el pie de página usando el recurso publicado en docs.pey.mx; se muestra texto alternativo si no hay conexión. La integración sigue pendiente.

## Formato del código (v0.4 — presentación ordenada)

Los archivos HTML, CSS, JavaScript y TypeScript se han organizado con sangría de **2 espacios**, saltos de línea y estructura consistente. No se modificaron la lógica, las traducciones, los estilos visuales ni las rutas del proyecto.

Se incluyen `.editorconfig` y `.prettierrc.json` para conservar un formato común si se usa un formateador compatible en VS Code. No se añade ninguna dependencia nueva para ejecutar el sitio.

Esta sigue siendo una **landing de demostración**: la integración de Pey, los pagos reales, Apple/Google Wallet y el acceso con cuentas todavía no están conectados.
