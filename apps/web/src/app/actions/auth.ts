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
    return { error: "Invalid email or password" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createSession(user.id, user.role);
  redirect("/");
}

export async function register(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashedPassword,
      role: "COHOST",
    },
  });

  await createSession(user.id, user.role);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
