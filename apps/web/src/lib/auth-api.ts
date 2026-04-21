import { cookies } from "next/headers";
import { decrypt } from "./session-crypto";
import { prisma } from "./prisma";

export async function getAuthUserId(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const payload = await decrypt(session);
  if (!payload?.userId) {
    throw new Error("Unauthorized");
  }
  return payload.userId;
}

export async function getUserPropertyIds(userId: string): Promise<string[]> {
  const properties = await prisma.property.findMany({
    where: { userId },
    select: { id: true },
  });
  return properties.map((p) => p.id);
}

export async function verifyPropertyOwnership(
  propertyId: string,
  userId: string
): Promise<boolean> {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId },
  });
  return !!property;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
