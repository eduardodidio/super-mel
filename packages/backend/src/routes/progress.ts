import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-mel-dev-secret";

/**
 * Inline preHandler for JWT authentication.
 * Sets `request.playerId` on success, returns 401 on failure.
 */
async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Token ausente" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { id: string };
    (request as any).playerId = payload.id;
  } catch {
    return reply.status(401).send({ error: "Token invalido" });
  }
}

/**
 * Deep merge for the `data` JSON field.
 * - Objects: shallow overwrite per key
 * - Arrays: union (deduplicated)
 * - Primitives: overwrite
 */
function mergeProgressData(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value) && Array.isArray(existing[key])) {
      // Union for arrays (deduplicate)
      merged[key] = [...new Set([...(existing[key] as unknown[]), ...value])];
    } else if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Check if a playerId is a dev-bypass or local-guest ID (not in the DB).
 */
function isNonDbPlayer(playerId: string): boolean {
  return playerId.startsWith("dev-") || playerId.startsWith("local-");
}

export async function progressRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  /**
   * GET /api/progress
   * Returns the authenticated player's progress.
   * Creates an empty Progress row if none exists (upsert semantics).
   * Dev-bypass users get an in-memory empty response.
   */
  app.get(
    "/",
    { preHandler: authPreHandler },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const playerId = (request as any).playerId as string;

      // Dev bypass / local guest users -- return empty progress without DB
      if (isNonDbPlayer(playerId)) {
        return {
          totalCoins: 0,
          data: {},
          updatedAt: new Date().toISOString(),
        };
      }

      let progress = await prisma.progress.findUnique({
        where: { playerId },
      });

      if (!progress) {
        progress = await prisma.progress.create({
          data: { playerId, totalCoins: 0, data: {} },
        });
      }

      return {
        totalCoins: progress.totalCoins,
        data: progress.data,
        updatedAt: progress.updatedAt,
      };
    }
  );

  /**
   * PUT /api/progress
   * Updates the authenticated player's progress.
   * Accepts partial body: { totalCoins?, data? }
   * Deep-merges the `data` JSON field (arrays: union, objects: overwrite).
   * Dev-bypass users get a no-op success response.
   */
  app.put<{
    Body: { totalCoins?: number; data?: Record<string, unknown> };
  }>(
    "/",
    { preHandler: authPreHandler },
    async (request: FastifyRequest<{ Body: { totalCoins?: number; data?: Record<string, unknown> } }>, reply: FastifyReply) => {
      const playerId = (request as any).playerId as string;
      const body = request.body || {};

      // Dev bypass / local guest users -- no-op
      if (isNonDbPlayer(playerId)) {
        return {
          totalCoins: body.totalCoins ?? 0,
          data: body.data ?? {},
          updatedAt: new Date().toISOString(),
        };
      }

      let progress = await prisma.progress.findUnique({
        where: { playerId },
      });

      if (!progress) {
        // Create with the provided values
        progress = await prisma.progress.create({
          data: {
            playerId,
            totalCoins: body.totalCoins ?? 0,
            data: body.data ?? {},
          },
        });
        return {
          totalCoins: progress.totalCoins,
          data: progress.data,
          updatedAt: progress.updatedAt,
        };
      }

      // Deep merge data field
      const existingData = (progress.data as Record<string, unknown>) || {};
      const mergedData = body.data
        ? mergeProgressData(existingData, body.data)
        : existingData;

      const updated = await prisma.progress.update({
        where: { playerId },
        data: {
          totalCoins: body.totalCoins ?? progress.totalCoins,
          data: mergedData,
        },
      });

      return {
        totalCoins: updated.totalCoins,
        data: updated.data,
        updatedAt: updated.updatedAt,
      };
    }
  );
}
