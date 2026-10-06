"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PiLockKeyFill } from "react-icons/pi";
import { PageHeader } from "@/components/shell/page-header";
import type { Owner } from "@/lib/session-token";
import type { AccountView, VaultBlob } from "@/lib/types";
import { loadDevice, type VaultData } from "@/lib/vault-crypto";
import { EnrollDevice } from "./enroll-device";
import { LockScreen } from "./lock-screen";
import { SetupVault } from "./setup-vault";
import { VaultList } from "./vault-list";

type Device = NonNullable<Awaited<ReturnType<typeof loadDevice>>>;
export type Unlocked = { key: CryptoKey; data: VaultData };

const IDLE_MS = 3 * 60 * 1000;
const HIDDEN_MS = 60 * 1000;

export function VaultApp({ owner, accounts, initialBlob }: { owner: Owner; accounts: AccountView[]; initialBlob: VaultBlob | null }) {
  const [blob, setBlob] = useState(initialBlob);
  const [device, setDevice] = useState<Device | null | undefined>(undefined);
  const [open, setOpen] = useState<Unlocked | null>(null);

  useEffect(() => {
    loadDevice().then(
      (d) => setDevice(d ?? null),
      () => setDevice(null),
    );
  }, []);

  const lock = useCallback(() => setOpen(null), []);
  useAutoLock(!!open, lock);

  let body: React.ReactNode;
  if (device === undefined) {
    body = <div className="py-24" />;
  } else if (!blob) {
    body = (
      <SetupVault
        onDone={(b, d, unlocked) => {
          setBlob(b);
          setDevice(d);
          setOpen(unlocked);
        }}
      />
    );
  } else if (!device || device.hash !== blob.deviceHash) {
    body = <EnrollDevice blob={blob} stale={!!device} onEnrolled={setDevice} />;
  } else if (!open) {
    body = <LockScreen owner={owner} blob={blob} device={device} onUnlock={setOpen} />;
  } else {
    body = (
      <VaultList
        accounts={accounts}
        blob={blob}
        unlocked={open}
        onChange={(b, u) => {
          setBlob(b);
          setOpen(u);
        }}
        onReset={() => {
          setBlob(null);
          setOpen(null);
        }}
        onForgetDevice={() => {
          setDevice(null);
          setOpen(null);
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Brankas"
        subtitle={open ? "Terbuka · terkunci otomatis setelah 3 menit diam" : "Terenkripsi di perangkat ini"}
        actions={
          open ? (
            <button type="button" className="btn" onClick={lock}>
              <PiLockKeyFill aria-hidden />
              Kunci
            </button>
          ) : undefined
        }
      />
      {body}
    </>
  );
}

/** Kunci saat diam terlalu lama, atau saat aplikasi ditinggal di latar belakang. */
function useAutoLock(active: boolean, lock: () => void) {
  const last = useRef(0);
  const hiddenAt = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    last.current = Date.now();
    const bump = () => (last.current = Date.now());
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > HIDDEN_MS) lock();
      else hiddenAt.current = null;
    };
    const tick = setInterval(() => Date.now() - last.current > IDLE_MS && lock(), 10_000);
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, lock]);
}
