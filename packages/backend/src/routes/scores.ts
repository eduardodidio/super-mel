import { FastifyInstance } from "fastify";

export async function scoreRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  app.post<{ Body: { playerId: string; distance: number; levelId?: string } }>(
    "/",
    async (request) => {
      const { playerId, distance, levelId } = request.body;
      const score = await prisma.score.create({
        data: { playerId, distance, levelId: levelId || null },
      });
      return score;
    },
  );

  app.get("/leaderboard", async (request) => {
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
  });

  app.get<{ Params: { playerId: string } }>(
    "/player/:playerId",
    async (request) => {
      const { playerId } = request.params;
      const best = await prisma.score.findFirst({
        where: { playerId },
        orderBy: { distance: "desc" },
      });
      const count = await prisma.score.count({ where: { playerId } });
      return { best, totalGames: count };
    },
  );
}
