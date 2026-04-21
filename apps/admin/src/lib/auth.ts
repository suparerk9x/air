import { cookies } from "next/headers";
import { decrypt } from "./session-crypto";

export async function getAdminUser(): Promise<{ userId: string; role: string }> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const payload = await decrypt(session);
  if (!payload?.userId || payload.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return { userId: payload.userId, role: payload.role };
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
