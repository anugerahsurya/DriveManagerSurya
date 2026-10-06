"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, [ok: boolean, text: string]> = {
  ok: [true, "Akun Google tersambung. Kuota sudah dibaca."],
  cancelled: [false, "Penyambungan dibatalkan."],
  state: [false, "Sesi penyambungan kedaluwarsa. Coba sambungkan lagi."],
  no_refresh: [false, "Google tidak memberi izin akses jangka panjang. Coba lagi dan setujui semua izin."],
  no_scope: [false, "Izin Google Drive tidak dicentang. Sambungkan lagi dan centang izin Drive."],
  failed: [false, "Gagal menyambungkan akun Google. Coba lagi."],
};

function Notice() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const code = params.get("connect");
  useEffect(() => {
    if (!code || !MESSAGES[code]) return;
    const [ok, text] = MESSAGES[code];
    if (ok) toast.success(text);
    else toast.error(text);
    router.replace(path, { scroll: false });
  }, [code, path, router]);
  return null;
}

export function ConnectNotice() {
  return (
    <Suspense>
      <Notice />
    </Suspense>
  );
}
