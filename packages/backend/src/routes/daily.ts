import { FastifyInstance } from "fastify";

function dailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function dateParamToDateStr(dateParam: string): string {
  // Input: "YYYY-MM-DD", output: "YYYYMMDD"
  return dateParam.replace(/-/g, "");
}

export async function dailyRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/daily/can-play?playerId=UUID
  app.get<{ Querystring: { playerId?: string } }>(
    "/can-play",
    async (request) => {
      const { playerId } = request.query;
      const todayStr = todayDateStr();
      const todaySeedValue = dailySeed(todayStr);
      const todayDate = `${todayStr.slice(0, 4)}-${todayStr.slice(4, 6)}-${todayStr.slice(6, 8)}`;

      if (!playerId) {
        return { canPlay: true, todaySeed: todaySeedValue, todayDate };
      }

      try {
        const existing = await prisma.score.findFirst({
          where: {
            playerId,
            mode: "daily",
            seed: todaySeedValue,
          },
        });
        return { canPlay: !existing, todaySeed: todaySeedValue, todayDate };
      } catch {
        return { canPlay: true, todaySeed: todaySeedValue, todayDate };
      }
    },
  );

  // GET /api/daily/leaderboard?date=YYYY-MM-DD
  app.get<{ Querystring: { date?: string } }>(
    "/leaderboard",
    async (request) => {
      const { date } = request.query;
      const dateStr = date ? dateParamToDateStr(date) : todayDateStr();
      const seedValue = dailySeed(dateStr);

      try {
        const scores = await prisma.score.findMany({
          where: {
            mode: "daily",
            seed: seedValue,
          },
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
    },
  );

  // GET /api/daily/my-result?playerId=UUID
  app.get<{ Querystring: { playerId?: string } }>(
    "/my-result",
    async (request) => {
      const { playerId } = request.query;
      if (!playerId) {
        return { played: false };
      }

      const todaySeedValue = dailySeed(todayDateStr());

      try {
        const myScore = await prisma.score.findFirst({
          where: {
            playerId,
            mode: "daily",
            seed: todaySeedValue,
          },
        });

        if (!myScore) {
          return { played: false };
        }

        const betterCount = await prisma.score.count({
          where: {
            mode: "daily",
            seed: todaySeedValue,
            distance: { gt: myScore.distance },
          },
        });

        const totalPlayers = await prisma.score.count({
          where: {
            mode: "daily",
            seed: todaySeedValue,
          },
        });

        return {
          played: true,
          distance: myScore.distance,
          rank: betterCount + 1,
          totalPlayers,
        };
      } catch {
        return { played: false };
      }
    },
  );
}
