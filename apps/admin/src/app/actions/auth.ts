"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

interface AuthState {
  error?: string;
}

export async function login(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid credentials" };
  }

  if (user.role !== "ADMIN") {
    return { error: "Access denied" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Invalid credentials" };
  }

  await createSession(user.id, user.role);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
