# Normas del Repositorio y Directrices para Agentes de IA

Este repositorio contiene un proyecto web estático interactivo: **Son Bot - Chat Interactivo**. Para mantener la consistencia del código, el rendimiento y la facilidad de despliegue, cualquier agente de IA que trabaje en este proyecto debe cumplir estrictamente con las siguientes reglas.

---

## 🛠️ Arquitectura y Tecnologías

1. **Vanilla Web Tech**: El proyecto está desarrollado únicamente con tecnologías web nativas (**HTML5**, **CSS3** plano y **JavaScript** clásico ES6+).
2. **Sin Entornos de Construcción (No Bundlers/No NPM)**:
   - **No** se permite el uso de Node.js, npm, webpack, Vite, TailwindCSS, TypeScript o cualquier otra herramienta que requiera compilación o instalación de dependencias locales.
   - El proyecto debe poder ejecutarse inmediatamente abriendo el archivo `index.html` en cualquier navegador web o levantando un servidor web estático básico (ej. Live Server).
3. **Librerías externas mediante CDN**:
   - Cualquier framework o script externo (como Compromise NLP o Stemmer-es) debe incluirse exclusivamente a través de etiquetas `<script>` o `<link>` apuntando a una red de distribución de contenidos (**CDN**) confiable (como `unpkg.com` o `jsdelivr.net`) directamente en [`index.html`](file:///c:/Users/castr/Desktop/aichatdoge/index.html).

---

## 🔄 Manejo de Versión y Cache Busting

Para evitar problemas de almacenamiento en caché en los navegadores de los usuarios finales tras realizar cambios en el diseño o en la lógica:

1. **Incrementar la versión**: Al modificar [`app.js`](file:///c:/Users/castr/Desktop/aichatdoge/app.js) o [`style.css`](file:///c:/Users/castr/Desktop/aichatdoge/style.css), se debe incrementar el número de versión (ejemplo: de `1.024` a `1.025`).
2. **Actualizar referencias en [`index.html`](file:///c:/Users/castr/Desktop/aichatdoge/index.html)**:
   - **Estilo**: `<link rel="stylesheet" href="style.css?v=1.0XX">`
   - **Script**: `<script src="app.js?v=1.0XX"></script>`
   - **Badge Visual**: Modificar el texto del elemento `.version-badge` en el header (`v1.0XX`) para reflejar la versión actual en la interfaz.

---

## 🎨 Compatibilidad de Emojis y Soporte para Windows

Dado que los sistemas operativos Windows no renderizan nativamente los emojis de banderas de países (mostrando en su lugar letras como "AR" para `🇦🇷`):

1. **En la caja de texto (Input)**:
   - Se debe utilizar la fuente `@font-face 'Twemoji Country Flags'` cargada en [`style.css`](file:///c:/Users/castr/Desktop/aichatdoge/style.css).
   - El `<textarea>` (o cualquier input) debe heredar esta familia tipográfica para que el navegador dibuje la bandera correctamente en pantalla de manera interna.
2. **En las burbujas de conversación**:
   - En [`app.js`](file:///c:/Users/castr/Desktop/aichatdoge/app.js), la función `formatMarkdown` debe interceptar los caracteres unicode de bandera (como `🇦🇷`) y reemplazarlos por su correspondiente etiqueta SVG en línea para garantizar que se muestren de forma gráfica y estilizada independientemente del sistema operativo.

---

## 💻 Control de Foco y Comportamiento del Teclado

1. **Mobile vs Desktop**:
   - En dispositivos móviles (`pointer: coarse`), la caja de texto debe desenfocarse (`blur`) y deshabilitarse temporalmente mientras el bot está pensando o escribiendo su respuesta para prevenir que el teclado virtual se abra automáticamente e interrumpa la experiencia del usuario.
   - En ordenadores de escritorio, **no** se debe desenfocar ni deshabilitar el input para asegurar que el desarrollador/usuario pueda seguir escribiendo de forma fluida y continua sin perder el foco del cursor.
2. **Bloqueo en el Habla**:
   - Utilizar la bandera de estado `isBotSpeaking` para interceptar y anular (ejecutar `blur()`) cualquier intento de foco manual del input en móviles durante la respuesta activa del bot.

---

## 📝 Commits y Control de Versión

1. **Commits Atómicos**: Cada commit debe representar un cambio lógico único y autocontenido (ej. resolver un bug específico, añadir una regla al bot o actualizar estilos).
2. **Mensaje de Commit**: Usar la convención estándar que empiece por la versión y describa brevemente la acción realizada. Ejemplo:
   - `v1.025 - Fix mobile keyboard re-opening bug by blocking focus during bot response`
   - `v1.026 - Add AGENT.md codebase guidelines`
