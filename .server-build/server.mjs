import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3e3);
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const REMINDER_DAYS = [7, 5, 4, 3];
function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  }
  return { clientId, clientSecret };
}
function getOAuth2Client() {
  const { clientId, clientSecret } = getOAuthConfig();
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${APP_URL}/auth/callback`
  );
}
function getNextIsoDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}
function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
async function startServer() {
  const app = express();
  const isSecureCookie = APP_URL.startsWith("https://") || process.env.NODE_ENV === "production";
  const SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "email",
    "profile"
  ];
  app.use(express.json());
  app.set("trust proxy", 1);
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "unad-secret-fallback"],
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      secure: isSecureCookie,
      sameSite: isSecureCookie ? "none" : "lax",
      httpOnly: true
    })
  );
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      appUrl: APP_URL
    });
  });
  app.get("/privacy", (req, res) => {
    res.send("<h1>Pol\xEDtica de Privacidad</h1><p>Esta aplicaci\xF3n solo utiliza los permisos de Google Calendar para crear recordatorios de tus cursos de la UNAD. No compartimos tus datos con terceros.</p>");
  });
  app.get("/api/auth/google/url", (req, res) => {
    try {
      const oauth2Client = getOAuth2Client();
      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "select_account consent",
        include_granted_scopes: true
      });
      res.json({ url });
    } catch (error) {
      console.error("OAuth URL generation error:", error);
      res.status(500).json({
        error: "No se pudo iniciar sesi\xF3n con Google. Verifica GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y APP_URL."
      });
    }
  });
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).send("No code provided");
    }
    try {
      const oauth2Client = getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);
      const request = req;
      const currentTokens = request.session?.tokens || {};
      const mergedTokens = {
        ...currentTokens,
        ...tokens
      };
      if (!request.session) {
        request.session = {};
      }
      request.session.tokens = mergedTokens;
      oauth2Client.setCredentials(mergedTokens);
      const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
      const userInfo = await oauth2.userinfo.get();
      request.session.user = { email: userInfo.data.email };
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, window.location.origin);
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticaci\xF3n exitosa. Esta ventana se cerrar\xE1 autom\xE1ticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });
  app.get("/api/auth/status", (req, res) => {
    const request = req;
    res.json({
      isAuthenticated: !!request.session?.tokens,
      email: request.session?.user?.email || null
    });
  });
  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });
  app.post("/api/calendar/sync", async (req, res) => {
    const request = req;
    const tokens = request.session?.tokens;
    if (!tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { activity } = req.body;
    const { name, description, endDate, courseName, courseCode } = activity || {};
    if (!activity || !name || !description || !endDate || !isIsoDate(endDate)) {
      return res.status(400).json({
        error: "Datos de actividad inv\xE1lidos. Se requiere name, description y endDate (YYYY-MM-DD)."
      });
    }
    try {
      const auth = getOAuth2Client();
      auth.setCredentials(tokens);
      auth.on("tokens", (updatedTokens) => {
        if (!request.session) return;
        request.session.tokens = {
          ...request.session.tokens || {},
          ...updatedTokens
        };
      });
      const calendar = google.calendar({ version: "v3", auth });
      const reminderOverrides = REMINDER_DAYS.map((day) => ({
        method: "popup",
        minutes: day * 24 * 60
      }));
      const event = {
        summary: `Entrega UNAD: ${name}`,
        description: [
          `Curso: ${courseName || "Sin curso asignado"}`,
          courseCode ? `C\xF3digo: ${courseCode}` : "",
          `Actividad: ${description}`,
          `Fecha l\xEDmite: ${endDate}`
        ].filter(Boolean).join("\n"),
        start: {
          date: endDate
        },
        end: {
          date: getNextIsoDate(endDate)
        },
        reminders: {
          useDefault: false,
          overrides: reminderOverrides
        }
      };
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event
      });
      res.json({
        success: true,
        eventId: response.data.id,
        reminderDays: REMINDER_DAYS
      });
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({
        error: "No se pudo sincronizar el evento en Google Calendar."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} UNAD Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV === "production") {
      const indexPath = path.join(process.cwd(), "dist", "index.html");
      if (fs.existsSync(indexPath)) {
        console.log("\u2705 Production: index.html found");
      } else {
        console.log("\u274C Production: index.html NOT found");
      }
    }
  });
}
startServer();
