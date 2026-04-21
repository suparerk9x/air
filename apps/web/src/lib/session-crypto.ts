import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "default-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  role: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return {
      userId: payload.userId as string,
      role: payload.role as string,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    return null;
  }
}
