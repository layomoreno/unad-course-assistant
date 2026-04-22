# UNAD Course Assistant

Aplicación web para gestionar actividades académicas y sincronizar fechas de entrega con Google Calendar.

## Funcionalidades

- Login con Google (popup OAuth).
- Selección de cursos y actividades.
- Creación de eventos de entrega en Google Calendar.
- Recordatorios automáticos **7, 5, 4 y 3 días antes** de la fecha límite.

## Requisitos

- Node.js 22+
- Proyecto de Google Cloud con API de Calendar habilitada

## Configuración de Google OAuth

1. En [Google Cloud Console](https://console.cloud.google.com/), habilita la **Google Calendar API**.
2. Configura la pantalla de consentimiento OAuth como **Externa**.
3. Crea un cliente OAuth tipo **Web application**.
4. Agrega estos URIs:
   - Local: `http://localhost:3000` y `http://localhost:3000/auth/callback`
   - Producción: `https://TU-APP.onrender.com` y `https://TU-APP.onrender.com/auth/callback`

Si quieres permitir acceso a cualquier cuenta (no solo usuarios de prueba), debes publicar la app OAuth en modo producción según las políticas de Google.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `APP_URL` (por defecto: `http://localhost:3000`)

## Ejecutar localmente

```bash
npm install
npm run dev
```

La app quedará en `http://localhost:3000`.

## Publicar en internet (Render)

1. Sube este proyecto a GitHub.
2. En Render, crea un nuevo **Web Service** conectando el repositorio.
3. Render tomará la configuración de `render.yaml`.
4. En variables de entorno de Render define:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APP_URL` con tu URL pública, por ejemplo `https://unad-course-assistant.onrender.com`
5. Despliega.
6. Vuelve a Google Cloud Console y confirma que en OAuth están los URIs públicos exactos de Render.

Cuando termine el deploy, la app quedará disponible públicamente por HTTPS.
