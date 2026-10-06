import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/session-token";

export async function POST(req: Request) {
  const res = NextResponse.redirect(`${appOrigin(req)}/login`, 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
