import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/env";
import { googleAuthUrl } from "@/lib/google";
import { newState, setStateCookie } from "@/lib/oauth-state";
import { getOwner } from "@/lib/session";

export async function GET(req: Request) {
  const origin = appOrigin(req);
  if (!(await getOwner())) return NextResponse.redirect(`${origin}/login`);

  const hint = new URL(req.url).searchParams.get("email") ?? undefined;
  const state = newState();
  const res = NextResponse.redirect(googleAuthUrl(`${origin}/api/google/callback`, state, hint));
  setStateCookie(res, "dm_g_state", state);
  return res;
}
