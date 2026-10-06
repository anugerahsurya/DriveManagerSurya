import { NextResponse } from "next/server";
import { refreshAccounts } from "@/lib/accounts";
import { env } from "@/lib/env";

// Dipanggil Vercel Cron sekali sehari supaya riwayat penyimpanan tetap terisi
// walau aplikasi tidak dibuka.
export async function GET(req: Request) {
  const secret = env.cronSecret();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { refreshed } = await refreshAccounts({ force: true });
  return NextResponse.json({ refreshed });
}
