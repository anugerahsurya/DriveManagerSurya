import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, type Owner, verifySession } from "./session-token";

export { SESSION_COOKIE };

export async function getOwner(): Promise<Owner | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Untuk halaman dan server action: hentikan bila bukan pemilik. */
export async function requireOwner(): Promise<Owner> {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  return owner;
}
