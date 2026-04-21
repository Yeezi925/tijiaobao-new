import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerWechatMiniRoutes } from "./wechat";
import { appRouter, miniAppRouter } from "../routers";
import { createContext, createMiniContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback
  registerOAuthRoutes(app);

  // 微信小程序登录
  registerWechatMiniRoutes(app);

  // AI 路由 — 动态 import 避免被 esbuild 提升到 startServer 之外
  const { registerPlanRoute } = await import("./generatePlan");
  const { registerAdviceRoute } = await import("./generateAdvice");
  const { registerDocumentRoute } = await import("./generateDocument");
  registerPlanRoute(app);
  registerAdviceRoute(app);
  registerDocumentRoute(app);

  // tRPC API (Web - Cookie auth)
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // tRPC API (小程序 - Authorization header token auth)
  app.use(
    "/api/mini/trpc",
    createExpressMiddleware({
      router: miniAppRouter,
      createContext: createMiniContext,
    })
  );

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
