import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-mel-dev-secret";

export async function authRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  app.post<{ Body: { name: string } }>("/guest", async (request, reply) => {
    const { name } = request.body;
    const player = await prisma.player.create({
      data: { name, isGuest: true },
    });
    const token = jwt.sign({ id: player.id, name: player.name }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return { player: { id: player.id, name: player.name, isGuest: true }, token };
  });

  app.post<{ Body: { name: string; password: string } }>("/register", async (request, reply) => {
    const { name, password } = request.body;
    const existing = await prisma.player.findFirst({
      where: { name, isGuest: false },
    });
    if (existing) {
      return reply.status(409).send({ error: "Nome ja em uso" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const player = await prisma.player.create({
      data: { name, password: hashed, isGuest: false },
    });
    const token = jwt.sign({ id: player.id, name: player.name }, JWT_SECRET, {
      expiresIn: "30d",
    });
    return { player: { id: player.id, name: player.name, isGuest: false }, token };
  });

  app.post<{ Body: { name: string; password: string } }>("/login", async (request, reply) => {
    const { name, password } = request.body;
    const player = await prisma.player.findFirst({
      where: { name, isGuest: false },
    });
    if (!player || !player.password) {
      return reply.status(401).send({ error: "Credenciais invalidas" });
    }
    const valid = await bcrypt.compare(password, player.password);
    if (!valid) {
      return reply.status(401).send({ error: "Credenciais invalidas" });
    }
    const token = jwt.sign({ id: player.id, name: player.name }, JWT_SECRET, {
      expiresIn: "30d",
    });
    return { player: { id: player.id, name: player.name, isGuest: false }, token };
  });
}
