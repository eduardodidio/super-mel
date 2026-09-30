import { FastifyInstance } from "fastify";

export async function scoreRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  app.post<{ Body: { playerId: string; distance: number; levelId?: string; mode?: string; seed?: number } }>(
    "/",
    async (request) => {
      const { playerId, distance, levelId, mode, seed } = request.body;
      try {
        const score = await prisma.score.create({
          data: {
            playerId,
            distance,
            levelId: levelId || null,
            mode: mode || "infinite",
            seed: seed ?? null,
          },
        });
        return score;
      } catch {
        return { id: `local-${Date.now()}`, playerId, distance, offline: true };
      }
    },
  );

  app.get("/leaderboard", async (request) => {
    try {
      const scores = await prisma.score.findMany({
        orderBy: { distance: "desc" },
        take: 20,
        include: { player: { select: { name: true } } },
      });
      return scores.map((s: any) => ({
        id: s.id,
        playerName: s.player.name,
        distance: s.distance,
        createdAt: s.createdAt,
      }));
    } catch {
      return [];
    }
  });

  app.get<{ Params: { playerId: string } }>(
    "/player/:playerId",
    async (request) => {
      const { playerId } = request.params;
      try {
        const best = await prisma.score.findFirst({
          where: { playerId },
          orderBy: { distance: "desc" },
        });
        const count = await prisma.score.count({ where: { playerId } });
        return { best, totalGames: count };
      } catch {
        return { best: null, totalGames: 0 };
      }
    },
  );
}
