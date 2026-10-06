import { VaultApp } from "@/components/vault/vault-app";
import { listAccounts } from "@/lib/accounts";
import { requireOwner } from "@/lib/session";
import { store } from "@/lib/store";
import type { VaultBlob } from "@/lib/types";

export const metadata = { title: "Brankas" };

export default async function VaultPage() {
  const [owner, accounts, blob] = await Promise.all([
    requireOwner(),
    listAccounts(),
    store().get<VaultBlob>("vault"),
  ]);
  return <VaultApp owner={owner} accounts={accounts} initialBlob={blob} />;
}
