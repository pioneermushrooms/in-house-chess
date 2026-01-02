import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupSocketIO } from "../socket";
import stripeWebhookRouter from "../stripe-webhook";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // DEBUG: Log DATABASE_URL for Railway troubleshooting
  const dbUrl = process.env.DATABASE_URL ?? "";
  console.log("[BOOT] DATABASE_URL present:", Boolean(dbUrl), "len:", dbUrl.length);
  console.log("[BOOT] DATABASE_URL startsWith mysql://", dbUrl.startsWith("mysql://"));
  if (dbUrl) {
    // Mask password for security
    const masked = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
    console.log("[BOOT] DATABASE_URL (masked):", masked);
  }
  
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST use raw body for signature verification
  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
  app.use(stripeWebhookRouter);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Google OAuth (legacy implementation)
  registerOAuthRoutes(app);
  const { setupGoogleOAuthRoutes } = await import("./googleOAuthRoutes.js");
  setupGoogleOAuthRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Socket.IO for real-time chess gameplay
  setupSocketIO(server);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
