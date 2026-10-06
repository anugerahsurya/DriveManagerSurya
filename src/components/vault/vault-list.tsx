"use client";

import { useEffect, useRef, useState } from "react";
import { PiCaretRightBold, PiCopyBold, PiEyeBold, PiEyeSlashBold, PiShuffleBold } from "react-icons/pi";
import { toast } from "sonner";
import { deleteVault, saveVault } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { Sheet } from "@/components/sheet";
import { displayName } from "@/lib/format";
import type { AccountView, VaultBlob } from "@/lib/types";
import { forgetDevice, resealVault, type VaultEntry } from "@/lib/vault-crypto";
import type { Unlocked } from "./vault-app";

const CLIPBOARD_MS = 30_000;

function generatePassword(len = 20) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+";
  const out = new Uint32Array(len);
  crypto.getRandomValues(out);
  return Array.from(out, (n) => chars[n % chars.length]).join("");
}

async function copySecret(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} disalin`, { description: "Clipboard dikosongkan dalam 30 detik." });
    setTimeout(() => {
      // Browser hanya mengizinkan saat halaman fokus; bila tidak, abaikan diam-diam.
      if (document.hasFocus()) navigator.clipboard.writeText("").catch(() => undefined);
    }, CLIPBOARD_MS);
  } catch {
    toast.error("Tidak bisa menyalin di browser ini.");
  }
}

export function VaultList({
  accounts,
  blob,
  unlocked,
  onChange,
  onReset,
  onForgetDevice,
}: {
  accounts: AccountView[];
  blob: VaultBlob;
  unlocked: Unlocked;
  onChange: (b: VaultBlob, u: Unlocked) => void;
  onReset: () => void;
  onForgetDevice: () => void;
}) {
  const [editing, setEditing] = useState<{ id: string; label: string; email?: string } | null>(null);
  const [danger, setDanger] = useState(false);
  const entries = unlocked.data.entries;
  const known = new Set(accounts.map((a) => a.id));
  const orphans = Object.keys(entries).filter((id) => !known.has(id));
  const filled = accounts.filter((a) => entries[a.id]?.password).length;

  async function persist(id: string, entry: VaultEntry | null) {
    const nextEntries = { ...entries };
    if (entry) nextEntries[id] = { ...entry, updatedAt: Date.now() };
    else delete nextEntries[id];
    const data = { ...unlocked.data, entries: nextEntries };
    const sealed = await resealVault(blob, unlocked.key, data);
    const res = await saveVault(sealed, blob.updatedAt);
    if (!res.ok) {
      toast.error("Brankas diubah dari perangkat lain. Muat ulang halaman lalu coba lagi.");
      return false;
    }
    onChange({ ...sealed, updatedAt: res.updatedAt }, { key: unlocked.key, data });
    return true;
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-7 px-4 pt-2 pb-8 md:px-8 md:pt-7">
      <section aria-labelledby="pw">
        <div className="flex items-baseline justify-between px-1 pb-2">
          <h2 id="pw" className="text-[13px] font-semibold text-ink-2">
            Password akun
          </h2>
          <span className="tnum text-[13px] text-ink-2">
            {filled} dari {accounts.length} tersimpan
          </span>
        </div>
        <div className="group-box">
          {accounts.map((a) => (
            <EntryRow
              key={a.id}
              account={a}
              entry={entries[a.id]}
              onEdit={() => setEditing({ id: a.id, label: displayName(a), email: a.email })}
            />
          ))}
          {accounts.length === 0 && <p className="p-4 text-[14px] text-ink-2">Sambungkan akun Drive dulu.</p>}
        </div>
      </section>

      {orphans.length > 0 && (
        <section aria-labelledby="orph">
          <h2 id="orph" className="group-title">
            Akun yang sudah diputuskan
          </h2>
          <div className="group-box">
            {orphans.map((id) => (
              <button key={id} type="button" className="group-row" onClick={() => setEditing({ id, label: `Akun ${id}` })}>
                <span className="flex-1 text-ink-2">Akun {id}</span>
                <PiCaretRightBold aria-hidden className="size-3 text-ink-3" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="dev" className="space-y-3">
        <h2 id="dev" className="group-title">
          Perangkat
        </h2>
        <div className="group-box">
          <button
            type="button"
            className="group-row"
            onClick={async () => {
              await forgetDevice();
              toast("Perangkat ini dilupakan. Butuh kode pemulihan untuk membuka lagi di sini.");
              onForgetDevice();
            }}
          >
            <span className="flex-1">Lupakan perangkat ini</span>
          </button>
        </div>
        <div className="group-box">
          <button type="button" className="group-row justify-center font-semibold text-critical" onClick={() => setDanger(true)}>
            Hapus brankas…
          </button>
        </div>
      </section>

      {editing && (
        <EntryEditor
          key={editing.id}
          title={editing.label}
          email={editing.email}
          entry={entries[editing.id]}
          onClose={() => setEditing(null)}
          onSave={async (e) => (await persist(editing.id, e)) && setEditing(null)}
        />
      )}
      <DeleteVault open={danger} onOpenChange={setDanger} onDeleted={onReset} />
    </div>
  );
}

function EntryRow({ account: a, entry, onEdit }: { account: AccountView; entry?: VaultEntry; onEdit: () => void }) {
  const [reveal, setReveal] = useState(false);
  const has = !!entry?.password;

  // Sembunyikan lagi otomatis setelah 15 detik.
  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => setReveal(false), 15_000);
    return () => clearTimeout(t);
  }, [reveal]);

  return (
    <div className="group-row">
      <Avatar account={a} size={34} />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="truncate font-semibold">{displayName(a)}</div>
        <div className={`tnum truncate text-[13px] ${has ? "" : "text-ink-2"}`}>
          {has ? (reveal ? entry!.password : "••••••••••••") : "Belum ada password · ketuk untuk menambah"}
        </div>
      </button>
      {has && (
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={reveal ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={reveal}
            onClick={() => setReveal((r) => !r)}
            className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-[var(--press)] md:size-8"
          >
            {reveal ? <PiEyeSlashBold /> : <PiEyeBold />}
          </button>
          <button
            type="button"
            aria-label={`Salin password ${displayName(a)}`}
            onClick={() => copySecret(entry!.password!, "Password")}
            className="grid size-10 place-items-center rounded-full text-accent transition-colors hover:bg-[var(--press)] md:size-8"
          >
            <PiCopyBold />
          </button>
        </div>
      )}
    </div>
  );
}

function EntryEditor({
  title,
  email,
  entry,
  onClose,
  onSave,
}: {
  title: string;
  email?: string;
  entry?: VaultEntry;
  onClose: () => void;
  onSave: (e: VaultEntry | null) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(true);
  const [password, setPassword] = useState(entry?.password ?? "");
  const [recovery, setRecovery] = useState(entry?.recovery ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [show, setShow] = useState(!entry?.password);
  const [busy, setBusy] = useState(false);
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const save = async (value: VaultEntry | null) => {
    setBusy(true);
    try {
      await onSave(value);
      toast.success(value ? "Tersimpan terenkripsi" : "Dihapus dari brankas");
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title={title} description={email} width={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save({ password, recovery: recovery || undefined, note: note || undefined });
        }}
        className="space-y-3"
      >
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-2">Password</span>
          <div className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="field tnum flex-1"
            />
            <button type="button" className="btn" aria-label={show ? "Sembunyikan" : "Tampilkan"} onClick={() => setShow((s) => !s)}>
              {show ? <PiEyeSlashBold /> : <PiEyeBold />}
            </button>
          </div>
        </label>
        <button
          type="button"
          className="btn btn-plain !px-0"
          onClick={() => {
            setPassword(generatePassword());
            setShow(true);
          }}
        >
          <PiShuffleBold aria-hidden />
          Buat password acak
        </button>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-2">Info pemulihan</span>
          <input
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
            autoComplete="off"
            placeholder="Email/nomor pemulihan, kode cadangan 2FA"
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-2">Catatan</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field resize-none" />
        </label>
        <div className="flex items-center gap-2 pt-2">
          {entry && (
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => save(null)}>
              Hapus
            </button>
          )}
          <span className="flex-1" />
          <button type="button" className="btn" onClick={close}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !password}>
            {busy ? "Mengenkripsi…" : "Simpan"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function DeleteVault({ open, onOpenChange, onDeleted }: { open: boolean; onOpenChange: (o: boolean) => void; onDeleted: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Hapus seluruh brankas?" width={440}>
      <p className="text-[14px] text-ink-2">
        Semua password tersimpan akan hilang permanen dan tidak bisa dipulihkan. Ketik <b className="text-ink">HAPUS BRANKAS</b> untuk
        melanjutkan.
      </p>
      <input value={text} onChange={(e) => setText(e.target.value)} className="field mt-3" autoComplete="off" />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn" onClick={() => onOpenChange(false)}>
          Batal
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={text !== "HAPUS BRANKAS" || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await deleteVault(text);
              await forgetDevice();
              toast.success("Brankas dihapus");
              onDeleted();
            } catch {
              toast.error("Gagal menghapus brankas.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Hapus permanen
        </button>
      </div>
    </Sheet>
  );
}
