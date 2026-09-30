import { FastifyInstance } from "fastify";
import { migrateLevelData } from "@super-mel/shared";
import type { LevelDataV2 } from "@super-mel/shared";
import { validateLevelDataV2 } from "../validation/levelValidation.js";

export async function levelRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  app.get("/", async (request) => {
    try {
      const levels = await prisma.level.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { creator: { select: { name: true } } },
      });
      return levels.map((l: any) => ({
        id: l.id,
        name: l.name,
        creatorName: l.creator.name,
        background: l.background,
        createdAt: l.createdAt,
      }));
    } catch {
      return [];
    }
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;
    try {
      const level = await prisma.level.findUnique({ where: { id } });
      if (!level) return reply.status(404).send({ error: "Fase nao encontrada" });

      // Auto-migrate data to v2 in response
      try {
        const migratedData = migrateLevelData(level.data);
        return { ...level, data: migratedData };
      } catch {
        // If migration fails, return raw data (don't break existing levels)
        return level;
      }
    } catch {
      return reply.status(503).send({ error: "Banco indisponivel" });
    }
  });

  app.post<{
    Body: { creatorId: string; name: string; data: any; background?: string };
  }>("/", async (request, reply) => {
    const { creatorId, name, data, background } = request.body;

    // 1. Try to migrate data to v2 (handles v1 input)
    let levelData: LevelDataV2;
    try {
      levelData = migrateLevelData(data);
    } catch (err: any) {
      return reply.status(400).send({ error: `Invalid level data: ${err.message}` });
    }

    // 2. Validate v2 structure
    const validation = validateLevelDataV2(levelData);
    if (!validation.valid) {
      return reply.status(400).send({
        error: "Invalid level data",
        details: validation.errors,
      });
    }

    // 3. Store the v2 data (always store as v2 going forward)
    try {
      const level = await prisma.level.create({
        data: {
          creatorId,
          name,
          data: levelData as any, // Prisma Json type
          background: background || (levelData.theme ?? "forest"),
        },
      });
      return level;
    } catch {
      return { id: `local-${Date.now()}`, creatorId, name, data: levelData, background: background || "forest", offline: true };
    }
  });

  app.put<{
    Params: { id: string };
    Body: { name?: string; data?: any; background?: string; published?: boolean };
  }>("/:id", async (request, reply) => {
    const { id } = request.params;
    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: "Fase nao encontrada" });

    // Validate data field when present
    if (request.body.data !== undefined) {
      let levelData: LevelDataV2;
      try {
        levelData = migrateLevelData(request.body.data);
      } catch (err: any) {
        return reply.status(400).send({ error: `Invalid level data: ${err.message}` });
      }

      const validation = validateLevelDataV2(levelData);
      if (!validation.valid) {
        return reply.status(400).send({
          error: "Invalid level data",
          details: validation.errors,
        });
      }

      // Replace raw data with migrated v2
      request.body.data = levelData;
    }

    const level = await prisma.level.update({
      where: { id },
      data: request.body,
    });
    return level;
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;
    await prisma.level.delete({ where: { id } });
    return { ok: true };
  });
}
