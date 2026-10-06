import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { listRecords, nextSlot, refreshAccounts, saveRecords, type AccountRecord } from "@/lib/accounts";
import { sealToken } from "@/lib/crypto";
import { appOrigin } from "@/lib/env";
import { exchangeCode, userInfo } from "@/lib/google";
import { checkState } from "@/lib/oauth-state";
import { getOwner } from "@/lib/session";

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  if (!(await getOwner())) return NextResponse.redirect(`${origin}/login`);

  const back = (query: string) => {
    const res = NextResponse.redirect(`${origin}/${query}`);
    res.cookies.delete("dm_g_state");
    return res;
  };

  const url = new URL(req.url);
  if (url.searchParams.get("error")) return back("?connect=cancelled");
  if (!checkState(req.cookies.get("dm_g_state")?.value, url.searchParams.get("state"))) return back("?connect=state");

  try {
    const tokens = await exchangeCode(url.searchParams.get("code") ?? "", `${origin}/api/google/callback`);
    if (!tokens.refresh_token) return back("?connect=no_refresh");
    const scopes = (tokens as { scope?: string }).scope ?? "";
    if (!scopes.includes("drive")) return back("?connect=no_scope");

    const me = await userInfo(tokens.access_token);
    const records = await listRecords();
    const existing = records.find((a) => a.googleSub === me.sub);
    let id: string;

    if (existing) {
      // Menyambung ulang: ganti token, pertahankan profil, catatan, dan riwayat.
      id = existing.id;
      Object.assign(existing, { token: sealToken(tokens.refresh_token), email: me.email, quotaError: undefined });
    } else {
      id = randomUUID().slice(0, 8);
      const record: AccountRecord = {
        id,
        googleSub: me.sub,
        email: me.email,
        googleName: me.name ?? me.email,
        token: sealToken(tokens.refresh_token),
        slot: nextSlot(records),
        connectedAt: Date.now(),
        apps: [],
      };
      records.push(record);
    }
    await saveRecords(records);
    await refreshAccounts({ ids: [id], force: true });
    return back(`akun/${id}?connect=ok`);
  } catch (e) {
    console.error("google callback", e);
    return back("?connect=failed");
  }
}
