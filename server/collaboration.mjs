import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { WebSocketServer } from "ws";
import * as Y from "yjs";

const prisma = new PrismaClient();
const port = Number(process.env.COLLABORATION_PORT ?? 1234);
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("NEXTAUTH_SECRET is required by the collaboration server");

const rooms = new Map();

function verify(token) {
  const [payloadText, signatureText] = String(token ?? "").split(".");
  if (!payloadText || !signatureText) throw new Error("Invalid collaboration token");
  const expected = createHmac("sha256", secret).update(payloadText).digest();
  const actual = Buffer.from(signatureText, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid collaboration token signature");
  }
  const payload = JSON.parse(Buffer.from(payloadText, "base64url").toString("utf8"));
  if (!payload.artifactId || !payload.userId || payload.exp < Date.now()) {
    throw new Error("Expired collaboration token");
  }
  return payload;
}

async function roomFor(artifactId) {
  if (rooms.has(artifactId)) return rooms.get(artifactId);

  const doc = new Y.Doc();
  const clients = new Set();
  const persisted = await prisma.collaborationDocument.findUnique({ where: { artifactId } });
  if (persisted?.updateBlob) {
    Y.applyUpdate(doc, new Uint8Array(persisted.updateBlob), "load");
  }

  let persistTimer;
  const persist = () => {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(async () => {
      const update = Y.encodeStateAsUpdate(doc);
      const vector = Y.encodeStateVector(doc);
      await prisma.collaborationDocument.upsert({
        where: { artifactId },
        create: {
          artifactId,
          updateBlob: Buffer.from(update),
          stateVector: Buffer.from(vector),
          version: 1,
        },
        update: {
          updateBlob: Buffer.from(update),
          stateVector: Buffer.from(vector),
          version: { increment: 1 },
        },
      });
    }, 250);
  };

  doc.on("update", (update, origin) => {
    if (origin !== "load") persist();
    for (const client of clients) {
      if (client.readyState === 1 && client !== origin) client.send(update);
    }
  });

  const room = { doc, clients };
  rooms.set(artifactId, room);
  return room;
}

const wss = new WebSocketServer({ port });

wss.on("connection", async (socket, request) => {
  let sessionId;
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const auth = verify(url.searchParams.get("token"));
    const clientId = url.searchParams.get("clientId") ?? crypto.randomUUID();
    const room = await roomFor(auth.artifactId);
    room.clients.add(socket);

    const session = await prisma.collaborationSession.upsert({
      where: { artifactId_clientId: { artifactId: auth.artifactId, clientId } },
      create: { artifactId: auth.artifactId, userId: auth.userId, clientId },
      update: { userId: auth.userId, lastSeenAt: new Date() },
    });
    sessionId = session.id;

    socket.send(Y.encodeStateAsUpdate(room.doc));

    socket.on("message", async (data) => {
      const bytes = data instanceof Buffer ? new Uint8Array(data) : new Uint8Array(data);
      Y.applyUpdate(room.doc, bytes, socket);
      await prisma.collaborationSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      }).catch(() => undefined);
    });

    socket.on("close", async () => {
      room.clients.delete(socket);
      await prisma.collaborationSession.delete({ where: { id: session.id } }).catch(() => undefined);
      if (room.clients.size === 0) {
        setTimeout(() => {
          if (room.clients.size === 0) {
            room.doc.destroy();
            rooms.delete(auth.artifactId);
          }
        }, 30_000);
      }
    });
  } catch (error) {
    socket.close(1008, error instanceof Error ? error.message.slice(0, 120) : "Unauthorized");
    if (sessionId) await prisma.collaborationSession.delete({ where: { id: sessionId } }).catch(() => undefined);
  }
});

console.log(`Collaboration WebSocket server listening on :${port}`);

process.on("SIGTERM", async () => {
  wss.close();
  await prisma.$disconnect();
  process.exit(0);
});
