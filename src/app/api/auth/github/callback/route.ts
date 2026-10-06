import { NextResponse, type NextRequest } from "next/server";
import { appOrigin, env } from "@/lib/env";
import { checkState } from "@/lib/oauth-state";
import { SESSION_COOKIE, SESSION_MAX_AGE, isAllowed, signSession } from "@/lib/session-token";

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${origin}/login?error=${reason}`);
    res.cookies.delete("dm_gh_state");
    return res;
  };

  const url = new URL(req.url);
  if (!checkState(req.cookies.get("dm_gh_state")?.value, url.searchParams.get("state"))) return fail("state");
  const code = url.searchParams.get("code");
  if (!code) return fail("cancelled");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.githubId(),
      client_secret: env.githubSecret(),
      code,
      redirect_uri: `${origin}/api/auth/github/callback`,
    }),
  });
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return fail("github");

  const userRes = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${access_token}`, accept: "application/vnd.github+json" },
  });
  if (!userRes.ok) return fail("github");
  const user = (await userRes.json()) as { id: number; login: string; name: string | null; avatar_url: string };

  // Token GitHub tidak disimpan; hanya dipakai sekali untuk memastikan identitas.
  if (!isAllowed(String(user.id), user.login)) return fail("not_allowed");

  const token = await signSession({
    id: String(user.id),
    login: user.login,
    name: user.name ?? user.login,
    avatar: user.avatar_url,
  });
  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.delete("dm_gh_state");
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
