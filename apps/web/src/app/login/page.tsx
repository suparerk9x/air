"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: undefined });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white mb-2">
            <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-2 rounded-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Air</span>
          </div>
          <p className="text-slate-400 text-sm">Property Management</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-center mb-6">Sign in to your account</h2>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
