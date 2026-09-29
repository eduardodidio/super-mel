import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.js";
import { scoreRoutes } from "./routes/scores.js";
import { levelRoutes } from "./routes/levels.js";

const prisma = new PrismaClient();

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
});

app.decorate("prisma", prisma);

app.get("/api/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(scoreRoutes, { prefix: "/api/scores" });
await app.register(levelRoutes, { prefix: "/api/levels" });

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`Super Mel backend running on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
