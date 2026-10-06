import { NextResponse } from "next/server";
import { appOrigin, env } from "@/lib/env";
import { newState, setStateCookie } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const state = newState();
  const params = new URLSearchParams({
    client_id: env.githubId(),
    redirect_uri: `${appOrigin(req)}/api/auth/github/callback`,
    scope: "read:user",
    state,
    allow_signup: "false",
  });
  const res = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
  setStateCookie(res, "dm_gh_state", state);
  return res;
}
