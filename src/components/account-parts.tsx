"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PiArrowSquareOutBold, PiPencilSimpleBold, PiPlusBold, PiTrashBold, PiXBold } from "react-icons/pi";
import { toast } from "sonner";
import { addLinkedApp, removeAccount, removeLinkedApp, updateProfile } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { AvatarPicker } from "@/components/avatar-picker";
import { Sheet } from "@/components/sheet";
import type { AccountView, Avatar as AvatarT, LinkedApp } from "@/lib/types";

// ---------------- Profil ----------------

export function ProfileEditor({
  account,
  open,
  onOpenChange,
}: {
  account: AccountView;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [nickname, setNickname] = useState(account.nickname ?? "");
  const [note, setNote] = useState(account.note ?? "");
  const [avatar, setAvatar] = useState<AvatarT | undefined>(account.avatar);
  const [pending, start] = useTransition();
  const preview = { ...account, nickname, avatar };

  const save = () =>
    start(async () => {
      try {
        await updateProfile(account.id, { nickname, note, avatar: avatar ?? null });
        toast.success("Profil disimpan");
        onOpenChange(false);
      } catch {
        toast.error("Profil gagal disimpan. Coba lagi.");
      }
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Ubah profil" description={account.email} width={600}>
      <div className="flex items-center gap-4">
        <Avatar account={preview} size={64} />
        <div className="min-w-0 flex-1 space-y-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-2">Nama panggilan</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder={account.googleName}
              className="field"
            />
          </label>
        </div>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-ink-2">Catatan</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="Mis. akun arsip foto 2019–2022"
          className="field resize-none"
        />
      </label>

      <div className="mt-5 mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold">Avatar</span>
        {avatar && (
          <button type="button" className="btn btn-plain !min-h-7 text-[13px]" onClick={() => setAvatar(undefined)}>
            Pakai inisial
          </button>
        )}
      </div>
      <AvatarPicker value={avatar} onChange={setAvatar} />

      <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-2 border-t border-[var(--separator)] bg-window px-5 pt-3">
        <button type="button" className="btn" onClick={() => onOpenChange(false)}>
          Batal
        </button>
        <button type="button" className="btn btn-primary" disabled={pending} onClick={save}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </Sheet>
  );
}

export function EditProfileButton({ account }: { account: AccountView }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn shrink-0" onClick={() => setOpen(true)}>
        <PiPencilSimpleBold aria-hidden />
        <span className="hidden sm:inline">Ubah</span>
        <span className="sr-only sm:hidden">Ubah profil</span>
      </button>
      {open && <ProfileEditor account={account} open={open} onOpenChange={setOpen} />}
    </>
  );
}

// ---------------- Aplikasi terhubung ----------------

export function LinkedApps({ accountId, apps, connectionsUrl }: { accountId: string; apps: LinkedApp[]; connectionsUrl: string }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      await addLinkedApp(accountId, name, note);
      setName("");
      setNote("");
      setAdding(false);
    });
  };

  return (
    <div className="group-box">
      {apps.map((app) => (
        <div key={app.id} className="group-row">
          <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-[var(--press)] text-[12px] font-bold">
            {app.name[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate">{app.name}</div>
            {app.note && <div className="truncate text-[12px] text-ink-2">{app.note}</div>}
          </div>
          <button
            type="button"
            aria-label={`Hapus ${app.name}`}
            disabled={pending}
            onClick={() => start(() => removeLinkedApp(accountId, app.id))}
            className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-[var(--press)] hover:text-critical"
          >
            <PiXBold aria-hidden />
          </button>
        </div>
      ))}

      {adding ? (
        <form onSubmit={add} className="space-y-2 p-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Nama aplikasi, mis. Canva"
            className="field"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={140}
            placeholder="Catatan (opsional), mis. login pakai Google"
            className="field"
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setAdding(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending || !name.trim()}>
              Tambah
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="group-row text-accent" onClick={() => setAdding(true)}>
          <span className="grid size-[26px] place-items-center">
            <PiPlusBold aria-hidden />
          </span>
          {apps.length ? "Tambah aplikasi" : "Catat aplikasi pertama"}
        </button>
      )}
      <a href={connectionsUrl} target="_blank" rel="noopener noreferrer" className="group-row text-accent">
        <span className="grid size-[26px] place-items-center">
          <PiArrowSquareOutBold aria-hidden />
        </span>
        Lihat daftar resmi di Google
      </a>
    </div>
  );
}

// ---------------- Putuskan ----------------

export function DisconnectButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      {/* Aksi berbahaya berdiri sendiri, jauh dari tombol lain. */}
      <div className="group-box">
        <button type="button" className="group-row justify-center font-semibold text-critical" onClick={() => setOpen(true)}>
          Putuskan akun ini
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} title={`Putuskan ${name}?`} width={420}>
        <p className="text-[14px] text-ink-2">
          Akses Google akan dicabut dan riwayat penyimpanan akun ini dihapus. Akun Google-nya sendiri tidak terpengaruh.
          Data brankas untuk akun ini tetap ada sampai Anda menghapusnya.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await removeAccount(id);
                toast.success(`${name} diputuskan`);
                router.push("/");
              })
            }
          >
            <PiTrashBold aria-hidden />
            {pending ? "Memutuskan…" : "Putuskan"}
          </button>
        </div>
      </Sheet>
    </>
  );
}
