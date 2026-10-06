import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

export async function proxy(req: NextRequest) {
  const owner = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (owner) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: [
    // google*.html = file verifikasi kepemilikan situs dari Google Search Console.
    "/((?!login|privasi|google[0-9a-f]+\\.html|brand/|api/auth|api/cron|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|logos.json).*)",
  ],
};
