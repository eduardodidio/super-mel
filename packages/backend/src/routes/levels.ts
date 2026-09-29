import { FastifyInstance } from "fastify";

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
      return level;
    } catch {
      return reply.status(503).send({ error: "Banco indisponivel" });
    }
  });

  app.post<{
    Body: { creatorId: string; name: string; data: any; background?: string };
  }>("/", async (request) => {
    const { creatorId, name, data, background } = request.body;
    try {
      const level = await prisma.level.create({
        data: {
          creatorId,
          name,
          data,
          background: background || "forest",
        },
      });
      return level;
    } catch {
      return { id: `local-${Date.now()}`, creatorId, name, data, background: background || "forest", offline: true };
    }
  });

  app.put<{
    Params: { id: string };
    Body: { name?: string; data?: any; background?: string; published?: boolean };
  }>("/:id", async (request, reply) => {
    const { id } = request.params;
    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: "Fase nao encontrada" });
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
