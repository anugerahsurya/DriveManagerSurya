"use client";

import { useState } from "react";
import { PiCaretRightBold } from "react-icons/pi";
import { ProfileEditor } from "@/components/account-parts";
import { Avatar } from "@/components/avatar";
import { displayName, logoName } from "@/lib/format";
import type { AccountView } from "@/lib/types";

export function ProfileList({ accounts }: { accounts: AccountView[] }) {
  const [editing, setEditing] = useState<AccountView | null>(null);

  if (accounts.length === 0) {
    return (
      <div className="group-box p-4 text-[14px] text-ink-2">
        Belum ada akun. Sambungkan akun Google dari tombol + di Dock.
      </div>
    );
  }

  return (
    <>
      <div className="group-box">
        {accounts.map((a) => (
          <button key={a.id} type="button" className="group-row" onClick={() => setEditing(a)}>
            <Avatar account={a} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{displayName(a)}</div>
              <div className="truncate text-[12px] text-ink-2">
                {a.avatar ? `Maskot ${logoName(a.avatar.key)}` : "Avatar inisial"} · {a.email}
              </div>
            </div>
            <PiCaretRightBold aria-hidden className="size-3 shrink-0 text-ink-3" />
          </button>
        ))}
      </div>
      {editing && (
        <ProfileEditor
          key={editing.id}
          account={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  );
}
