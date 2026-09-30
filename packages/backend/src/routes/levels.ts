import { FastifyInstance } from "fastify";
import { migrateLevelData } from "@super-mel/shared";
import type { LevelDataV2 } from "@super-mel/shared";
import { validateLevelDataV2 } from "../validation/levelValidation.js";

// --- Code generation utility ---
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 30 chars, no 0/O/1/I/L

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// --- Difficulty calculation ---
function getDifficulty(plays: number, clears: number): string | null {
  if (plays < 5) return null;
  if (clears === 0) return "Extremo";
  const rate = clears / plays;
  if (rate >= 0.5) return "Facil";
  if (rate >= 0.2) return "Normal";
  if (rate >= 0.05) return "Dificil";
  return "Extremo";
}

// --- Valid stamps and report reasons ---
const VALID_STAMPS = ["paw", "heart", "bone", "star"];
const VALID_REASONS = ["nome_inadequado", "conteudo_ofensivo", "impossivel", "outro"];

export async function levelRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET / -- Enhanced listing with stats, sorting, family mode
  app.get<{
    Querystring: { sort?: string; familyMode?: string };
  }>("/", async (request) => {
    try {
      const { sort, familyMode } = request.query;
      const isFamilyMode = familyMode !== "false"; // default true

      const where: any = { published: true };
      if (isFamilyMode) {
        where.approved = true;
      }

      const orderBy: any =
        sort === "popular" ? { plays: "desc" as const } : { createdAt: "desc" as const };

      const levels = await prisma.level.findMany({
        where,
        orderBy,
        take: 50,
        include: { creator: { select: { name: true } } },
      });

      return levels.map((l: any) => {
        const clearRate = l.plays > 0 ? l.clears / l.plays : 0;
        return {
          id: l.id,
          name: l.name,
          creatorName: l.creator.name,
          background: l.background,
          createdAt: l.createdAt,
          code: l.code,
          plays: l.plays,
          clears: l.clears,
          clearRate,
          difficulty: getDifficulty(l.plays, l.clears),
        };
      });
    } catch {
      return [];
    }
  });

  // GET /code/:code -- Lookup level by 6-char code (bypasses family mode)
  app.get<{ Params: { code: string } }>("/code/:code", async (request, reply) => {
    const code = request.params.code.toUpperCase();
    try {
      const level = await prisma.level.findUnique({
        where: { code },
        include: { creator: { select: { name: true } } },
      });
      if (!level) return reply.status(404).send({ error: "Codigo nao encontrado" });

      // Auto-migrate data to v2 in response
      try {
        const migratedData = migrateLevelData(level.data);
        return { ...level, data: migratedData, creatorName: level.creator.name };
      } catch {
        return { ...level, creatorName: level.creator.name };
      }
    } catch {
      return reply.status(503).send({ error: "Banco indisponivel" });
    }
  });

  // GET /:id -- Single level by ID
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

  // POST / -- Create level
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

    // 3. Auth gate: reject custom assets from guest/anonymous players
    const hasCustomAssets = levelData.customAssets && levelData.customAssets.length > 0;
    if (hasCustomAssets) {
      if (creatorId.startsWith("local-")) {
        return reply.status(403).send({
          error: "Crie uma conta para usar imagens personalizadas",
        });
      }
      // For DB users, check isGuest flag
      try {
        const player = await prisma.player.findUnique({ where: { id: creatorId } });
        if (player?.isGuest) {
          return reply.status(403).send({
            error: "Crie uma conta para usar imagens personalizadas",
          });
        }
      } catch {
        // If DB is down, allow save (graceful degradation)
      }
    }

    // 4. Store the v2 data (always store as v2 going forward)
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

  // PUT /:id -- Update level (with clear check gate on publish)
  app.put<{
    Params: { id: string };
    Body: { name?: string; data?: any; background?: string; published?: boolean; cleared?: boolean };
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

      // Auth gate: reject custom assets from guest/anonymous players
      const hasCustomAssets = levelData.customAssets && levelData.customAssets.length > 0;
      if (hasCustomAssets) {
        const creatorId = existing.creatorId as string;
        if (creatorId.startsWith("local-")) {
          return reply.status(403).send({
            error: "Crie uma conta para usar imagens personalizadas",
          });
        }
        try {
          const player = await prisma.player.findUnique({ where: { id: creatorId } });
          if (player?.isGuest) {
            return reply.status(403).send({
              error: "Crie uma conta para usar imagens personalizadas",
            });
          }
        } catch {
          // If DB is down, allow save (graceful degradation)
        }
      }

      // Replace raw data with migrated v2
      request.body.data = levelData;
    }

    // Clear check gate: when publishing, creator must have cleared the level
    if (request.body.published === true) {
      // Check the current cleared status (might have just been set in body or already in DB)
      const currentCleared = request.body.cleared === true || existing.cleared;
      if (!currentCleared) {
        return reply.status(400).send({ error: "Voce precisa zerar a fase antes de publicar" });
      }

      // Generate unique 6-char code on first publish
      if (!existing.code) {
        let code: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = generateCode();
          try {
            await prisma.level.update({
              where: { id },
              data: { code: candidate },
            });
            code = candidate;
            break;
          } catch (err: any) {
            // P2002 = unique constraint violation -- retry
            if (err?.code === "P2002") continue;
            throw err;
          }
        }
        if (!code) {
          return reply.status(500).send({ error: "Erro ao gerar codigo da fase" });
        }
      }
    }

    // Build update data explicitly to avoid passing unexpected fields
    const updateData: any = {};
    if (request.body.name !== undefined) updateData.name = request.body.name;
    if (request.body.data !== undefined) updateData.data = request.body.data;
    if (request.body.background !== undefined) updateData.background = request.body.background;
    if (request.body.published !== undefined) updateData.published = request.body.published;
    if (request.body.cleared !== undefined) updateData.cleared = request.body.cleared;

    const level = await prisma.level.update({
      where: { id },
      data: updateData,
    });
    return level;
  });

  // DELETE /:id -- Delete level
  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;
    await prisma.level.delete({ where: { id } });
    return { ok: true };
  });

  // POST /:id/attempt -- Record a play attempt
  app.post<{
    Params: { id: string };
    Body: { playerId: string; cleared?: boolean; time?: number };
  }>("/:id/attempt", async (request, reply) => {
    const { id } = request.params;
    const { playerId, cleared, time } = request.body;

    if (!playerId) {
      return reply.status(400).send({ error: "playerId obrigatorio" });
    }

    try {
      // Create attempt
      const attempt = await prisma.levelAttempt.create({
        data: { levelId: id, playerId, cleared: cleared ?? false, time },
      });

      // Update level stats
      const updateData: any = { plays: { increment: 1 } };
      if (cleared) {
        updateData.clears = { increment: 1 };

        // Update bestTime if this time is better
        if (time) {
          const level = await prisma.level.findUnique({ where: { id }, select: { bestTime: true } });
          if (level && (level.bestTime === null || time < level.bestTime)) {
            updateData.bestTime = time;
          }
        }
      }

      await prisma.level.update({
        where: { id },
        data: updateData,
      });

      return attempt;
    } catch {
      return reply.status(500).send({ error: "Erro ao registrar tentativa" });
    }
  });

  // POST /:id/reaction -- Upsert a stamp reaction
  app.post<{
    Params: { id: string };
    Body: { playerId: string; stamp: string };
  }>("/:id/reaction", async (request, reply) => {
    const { id } = request.params;
    const { playerId, stamp } = request.body;

    if (!VALID_STAMPS.includes(stamp)) {
      return reply.status(400).send({ error: "Carimbo invalido" });
    }

    if (!playerId) {
      return reply.status(400).send({ error: "playerId obrigatorio" });
    }

    try {
      const reaction = await prisma.levelReaction.upsert({
        where: {
          levelId_playerId: { levelId: id, playerId },
        },
        update: { stamp },
        create: { levelId: id, playerId, stamp },
      });

      return reaction;
    } catch {
      return reply.status(500).send({ error: "Erro ao reagir" });
    }
  });

  // DELETE /:id/reaction -- Remove a player's reaction
  app.delete<{
    Params: { id: string };
    Body: { playerId: string };
  }>("/:id/reaction", async (request, reply) => {
    const { id } = request.params;
    const { playerId } = (request.body || {}) as { playerId?: string };

    if (!playerId) {
      return reply.status(400).send({ error: "playerId obrigatorio" });
    }

    try {
      await prisma.levelReaction.delete({
        where: {
          levelId_playerId: { levelId: id, playerId },
        },
      });
      return { ok: true };
    } catch {
      return { ok: true }; // Idempotent: no reaction to delete is fine
    }
  });

  // GET /:id/reactions -- Get reaction counts + player's current stamp
  app.get<{
    Params: { id: string };
    Querystring: { playerId?: string };
  }>("/:id/reactions", async (request, reply) => {
    const { id } = request.params;
    const { playerId } = request.query;

    try {
      // Count per stamp
      const counts = await prisma.levelReaction.groupBy({
        by: ["stamp"],
        where: { levelId: id },
        _count: { stamp: true },
      });

      const stampCounts: Record<string, number> = {
        paw: 0, heart: 0, bone: 0, star: 0,
      };
      for (const c of counts) {
        stampCounts[c.stamp] = c._count.stamp;
      }

      // Current player's reaction
      let playerStamp: string | null = null;
      if (playerId) {
        const reaction = await prisma.levelReaction.findUnique({
          where: {
            levelId_playerId: { levelId: id, playerId },
          },
        });
        playerStamp = reaction?.stamp ?? null;
      }

      return { stamps: stampCounts, playerStamp };
    } catch {
      return { stamps: { paw: 0, heart: 0, bone: 0, star: 0 }, playerStamp: null };
    }
  });

  // POST /:id/report -- Report a level
  app.post<{
    Params: { id: string };
    Body: { playerId: string; reason: string };
  }>("/:id/report", async (request, reply) => {
    const { id } = request.params;
    const { playerId, reason } = request.body;

    if (!VALID_REASONS.includes(reason)) {
      return reply.status(400).send({ error: "Motivo invalido" });
    }

    if (!playerId) {
      return reply.status(400).send({ error: "playerId obrigatorio" });
    }

    try {
      await prisma.levelReport.create({
        data: { levelId: id, playerId, reason },
      });
      return { ok: true };
    } catch {
      // Unique constraint: player already reported this level
      return reply.status(409).send({ error: "Voce ja denunciou esta fase" });
    }
  });
}
