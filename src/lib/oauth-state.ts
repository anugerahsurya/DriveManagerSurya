import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

// State OAuth disimpan di cookie httpOnly berumur pendek untuk mencegah CSRF login.

export function newState() {
  return randomBytes(24).toString("base64url");
}

export function setStateCookie(res: NextResponse, name: string, state: string) {
  res.cookies.set(name, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}

export function checkState(expected: string | undefined, actual: string | null) {
  if (!expected || !actual) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}
