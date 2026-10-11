# Nikolas Luque · Portafolio 3D

**Software, creatividad y visión de negocio.** Portafolio personal de **David Nikolas Ríos Luque**, desarrollado bajo la identidad profesional **Nikolas Luque**.

Una presentación interactiva de mis capacidades en desarrollo web, Android y datos, con una escena de cristal y cromo, animaciones con física y un asistente J.A.R.V.I.S. integrado.

## Qué incluye

- **Escena 3D con Three.js:** materiales físicos, iluminación de estudio y una composición que cambia con el cursor y el recorrido de la página.
- **Movimiento con resortes:** retrato en capas, tarjetas con perspectiva, botones con respuesta elástica y pestañas animadas.
- **Stack explorable:** frontend, backend, Android, datos, control de versiones y herramientas.
- **J.A.R.V.I.S.:** interfaz central, entrada por texto, voz cuando el navegador la admite y 336 ejemplos de comandos locales.
- **Utilidades reales:** cálculo, conversiones, texto, JSON, fechas, temporizador, cronómetro, archivos de calendario y consulta de repositorios públicos.
- **Accesibilidad:** navegación por teclado, control para pausar el movimiento y respeto de `prefers-reduced-motion`.
- **IA opcional:** adaptadores del lado del servidor para NVIDIA y OpenAI. La página y los comandos locales no requieren ninguna clave.

Los comandos no dan acceso a cuentas privadas ni controlan el sistema operativo. Los enlaces a servicios externos se preparan para que el visitante los abra; un archivo de calendario descargado no equivale a crear un evento en una cuenta conectada.

## Tecnología

| Área | Implementación |
| --- | --- |
| Aplicación | Next.js App Router, React y TypeScript |
| 3D | Three.js, WebGL, materiales físicos y `RoomEnvironment` |
| Interfaz | CSS, Tailwind CSS, componentes shadcn/Radix y Lucide |
| Animación | Integrador de resortes propio y `requestAnimationFrame` |
| Asistente | Motor de comandos tipado, Web Speech API y rutas del servidor |
| Verificación | TypeScript, pruebas con `node:test` y revisión de secretos |

Esta edición pública conserva el diseño y las funciones del portafolio, y utiliza Next.js directamente para poder ejecutarse fuera del alojamiento original.

## Ejecutar en tu computadora

Requisitos: **Node.js 24** y **pnpm 11.25.0**. Compatible con Windows, macOS y Linux.

Después de clonar o descargar este repositorio, abre una terminal en la carpeta del proyecto:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre **http://127.0.0.1:3000**. No necesitas crear un archivo de variables para ver la página ni usar los comandos locales. El servidor de desarrollo escucha únicamente en tu computadora.

### Compilar

```bash
pnpm build
pnpm start
```

Este proyecto contiene rutas de servidor. Para desplegarlo completo, utiliza un alojamiento compatible con Next.js/Node.js; GitHub Pages por sí solo no ejecuta esas rutas.

### Comprobar el código

```bash
pnpm typecheck
pnpm test
pnpm check:secrets
```

Las pruebas de los proveedores simulan las respuestas HTTP: no necesitan claves reales ni consumen una API.

## IA opcional en desarrollo local

1. Copia `.env.example` a `.env.local`.
2. Cambia `JARVIS_ENABLE_LOCAL_AI` a `true`.
3. Introduce **tu propia** clave de NVIDIA en `NVIDIA_API_KEY`.
4. Conserva o selecciona un modelo admitido en `lib/jarvis/nvidia.ts`.
5. Reinicia `pnpm dev` y comprueba la conexión desde J.A.R.V.I.S.

También existe un adaptador de OpenAI: selecciona `AI_PROVIDER=openai` y configura `OPENAI_API_KEY`. El modelo y las opciones de cada adaptador están en `lib/jarvis/`; su disponibilidad depende de la cuenta y del proveedor.

Las claves permanecen en el servidor y `.env.local` está excluido de Git. **La edición pública no habilita solicitudes de IA de pago en producción.** Para ofrecer IA a visitantes, integra autenticación y límites de uso del servidor antes de cambiar `lib/jarvis/local-access.ts`. Los comandos locales de J.A.R.V.I.S. sí siguen disponibles en producción.

La voz depende de las funciones y permisos del navegador. La escena 3D requiere WebGL; si no está disponible, el contenido HTML continúa siendo accesible.

## Organización del proyecto

| Ruta | Responsabilidad |
| --- | --- |
| `app/page.tsx` | Contenido, navegación, secciones y datos del stack |
| `app/globals.css` | Sistema visual, profundidad y adaptación a móviles |
| `lib/spatial-scene.ts` | Escena, materiales, iluminación y recorrido 3D |
| `lib/material-spring.ts` | Física de resortes |
| `components/portfolio/` | Retrato, animaciones, consola, voz y detalles |
| `lib/jarvis/engine.ts` | Interpretación y catálogo de comandos |
| `lib/jarvis/` | Adaptadores de IA, validación, acceso y utilidades |
| `app/api/jarvis/` | Rutas de chat, conexión y GitHub público |
| `public/` | Fotografía, favicon e imágenes de referencia |
| `scripts/` | Pruebas y comprobación previa a publicación |

## Adaptarlo

- Cambia la presentación y las tecnologías en `app/page.tsx`.
- Ajusta la información que conoce J.A.R.V.I.S. en `lib/portfolio-assistant.ts` y los textos del sistema de los adaptadores de IA en `lib/jarvis/`.
- Sustituye los datos de contacto, GitHub y LinkedIn por los tuyos.
- Reemplaza el retrato y las imágenes por recursos que puedas reutilizar.
- Cambia los colores y superficies en `app/globals.css`, y la escena en `lib/spatial-scene.ts`.
- Actualiza el título y la descripción en `app/layout.tsx`.

## Autor y contacto

**David Nikolas Ríos Luque · Nikolas Luque**

Arequipa, Perú · Desarrollo de software y visión de negocio.

- [GitHub](https://github.com/davidriosl-code)
- [LinkedIn](https://www.linkedin.com/in/nikolas-r%C3%ADos-luque-510a641a2/)
- [Correo](mailto:driosluque@gmail.com)

## Licencia

El código original y la documentación se distribuyen bajo la [licencia MIT](LICENSE). Puedes estudiar, adaptar y redistribuir el código manteniendo el aviso de licencia.

La fotografía personal, la identidad y las imágenes aportadas como referencia **no están incluidas en la licencia MIT del código**. Consulta [public/ASSETS.md](public/ASSETS.md) antes de reutilizar esos recursos. Las dependencias y componentes de terceros conservan sus propias licencias; consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
