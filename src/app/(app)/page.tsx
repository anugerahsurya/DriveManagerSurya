import Link from "next/link";
import { PiCaretRightBold, PiGoogleLogoBold, PiPlusBold, PiHardDrivesFill, PiWarningCircleFill, PiWarningFill } from "react-icons/pi";
import { Avatar } from "@/components/avatar";
import { AutoRefresh, RefreshButton } from "@/components/refresher";
import { SegmentBar, SegmentLegend, type Segment } from "@/components/segment-bar";
import { PageHeader } from "@/components/shell/page-header";
import { listAccounts } from "@/lib/accounts";
import { ago, bytes, displayName, level, pct, percent } from "@/lib/format";
import type { AccountView } from "@/lib/types";

export const metadata = { title: "Ringkasan" };

const slotColor = (slot: number) => (slot < 8 ? `var(--s${slot})` : "var(--s-other)");

export default async function OverviewPage() {
  const accounts = await listAccounts();
  if (accounts.length === 0) return <Empty />;

  const measured = accounts.filter((a) => a.quota);
  const capacity = measured.reduce((s, a) => s + (a.quota!.limit ?? 0), 0);
  const used = measured.reduce((s, a) => s + a.quota!.usage, 0);
  const unlimited = measured.filter((a) => a.quota!.limit == null).length;

  // Slot 0–7 punya warna sendiri; sisanya dilipat jadi "Akun lain" (tidak pernah warna ke-9).
  const segments: Segment[] = [];
  let other = 0;
  for (const a of [...measured].sort((x, y) => x.slot - y.slot)) {
    if (a.slot < 8) segments.push({ key: a.id, label: displayName(a), value: a.quota!.usage, color: slotColor(a.slot) });
    else other += a.quota!.usage;
  }
  if (other) segments.push({ key: "other", label: "Akun lain", value: other, color: "var(--s-other)" });

  const attention = accounts.filter((a) => a.quotaError || level(a) === "critical" || level(a) === "warn");
  const lastAt = Math.max(0, ...measured.map((a) => a.quota!.at));
  const sorted = [...accounts].sort(
    (a, b) => (b.quota ? (percent(b.quota.usage, b.quota.limit) ?? 0) : -1) - (a.quota ? (percent(a.quota.usage, a.quota.limit) ?? 0) : -1),
  );

  return (
    <>
      <AutoRefresh />
      <PageHeader
        title="Ringkasan"
        subtitle={lastAt ? `Diperbarui ${ago(lastAt)}` : undefined}
        actions={<RefreshButton />}
      />

      <div className="mx-auto max-w-[760px] space-y-7 px-4 pt-2 md:px-8 md:pt-7">
        {/* Disk gabungan, seperti Macintosh HD di "About This Mac › Storage" */}
        <section aria-labelledby="disk" className="group-box p-4 md:p-5">
          <div className="flex items-start gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-[11px] bg-[linear-gradient(180deg,#eef0f3,#d5d9df)] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)] md:size-14">
              <PiHardDrivesFill aria-hidden className="size-7 text-[#5b6170] md:size-8" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="disk" className="text-[16px] font-bold">
                Semua Drive
              </h2>
              <p className="tnum text-[13px] text-ink-2">
                Total gabungan dari {accounts.length} akun Google
                {capacity ? ` · ${pct((used / capacity) * 100)} terpakai` : ""}
              </p>
            </div>
          </div>
          {/* Angka total ala panel "Get Info": tiga baris nilai sejajar, bukan kartu metrik. */}
          <dl className="tnum mt-4 grid grid-cols-3 divide-x divide-[var(--separator)] rounded-[10px] bg-content py-2.5 text-center">
            {[
              ["Terpakai", bytes(used)],
              ["Tersedia", capacity ? bytes(Math.max(0, capacity - used)) : "—"],
              ["Kapasitas", capacity ? bytes(capacity) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="px-2">
                <dt className="text-[12px] text-ink-2">{k}</dt>
                <dd className="text-[15px] font-bold md:text-[14px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <SegmentBar
              segments={segments}
              total={capacity || used}
              label={`Penyimpanan gabungan: ${bytes(used)} terpakai dari ${bytes(capacity)}`}
            />
          </div>
          <div className="mt-3">
            <SegmentLegend segments={segments} free={capacity ? Math.max(0, capacity - used) : null} />
          </div>
          {unlimited > 0 && (
            <p className="mt-3 text-[12px] text-ink-2">
              {unlimited} akun tanpa batas kuota tidak dihitung dalam kapasitas.
            </p>
          )}
        </section>

        {attention.length > 0 && (
          <section aria-labelledby="attn">
            <h2 id="attn" className="group-title">
              Perlu perhatian
            </h2>
            <div className="group-box">
              {attention.map((a) => (
                <AttentionRow key={a.id} account={a} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="list">
          <h2 id="list" className="group-title">
            Akun Drive
          </h2>
          <div className="group-box">
            {sorted.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
            <a href="/api/google/connect" className="group-row text-accent">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft">
                <PiPlusBold aria-hidden />
              </span>
              <span className="font-semibold">Sambungkan akun Google lain</span>
            </a>
          </div>
        </section>

        <p className="pb-4 text-center text-[12px] text-ink-2">
          Kapasitas dihitung dalam satuan desimal (1 GB = 1.000 MB), sama seperti Google.
        </p>
      </div>
    </>
  );
}

function AccountRow({ account: a }: { account: AccountView }) {
  const p = a.quota ? percent(a.quota.usage, a.quota.limit) : null;
  const lv = level(a);
  const barColor = lv === "critical" ? "var(--critical)" : lv === "warn" ? "var(--s3)" : "var(--accent)";
  return (
    <Link href={`/akun/${a.id}`} className="group-row">
      <Avatar account={a} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-semibold">{displayName(a)}</span>
          <span className="tnum shrink-0 text-[13px] text-ink-2">
            {a.quota ? (a.quota.limit ? `${bytes(a.quota.usage)} / ${bytes(a.quota.limit)}` : bytes(a.quota.usage)) : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="truncate text-[12px] text-ink-2">{a.email}</span>
          {p != null && (
            <span className="ml-auto flex shrink-0 items-center gap-2">
              <span className="relative h-[5px] w-16 overflow-hidden rounded-full bg-track md:w-24">
                <span
                  className="bar-fill absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${Math.max(p, 2)}%`, background: barColor }}
                />
              </span>
              <span
                className={`tnum w-[5ch] text-right text-[12px] ${lv === "critical" ? "font-semibold text-critical" : "text-ink-2"}`}
              >
                {pct(p)}
              </span>
            </span>
          )}
        </div>
      </div>
      <PiCaretRightBold aria-hidden className="size-3 shrink-0 text-ink-3" />
    </Link>
  );
}

function AttentionRow({ account: a }: { account: AccountView }) {
  const lv = level(a);
  const p = a.quota ? percent(a.quota.usage, a.quota.limit) : null;
  const [Icon, color, text] = a.quotaError
    ? [PiWarningCircleFill, "text-critical", a.quotaError]
    : lv === "critical"
      ? [PiWarningCircleFill, "text-critical", `Hampir penuh · ${pct(p!)} terpakai`]
      : [PiWarningFill, "text-warning", `Mulai penuh · ${pct(p!)} terpakai`];
  return (
    <Link href={`/akun/${a.id}`} className="group-row">
      <Icon aria-hidden className={`size-5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{displayName(a)}</div>
        <div className={`truncate text-[12px] ${color}`}>{text}</div>
      </div>
      <PiCaretRightBold aria-hidden className="size-3 shrink-0 text-ink-3" />
    </Link>
  );
}

function Empty() {
  return (
    <>
      <PageHeader title="Ringkasan" />
      <div className="mx-auto flex max-w-[420px] flex-col items-center px-6 pt-16 text-center md:pt-24">
        <span className="grid size-20 place-items-center rounded-[20px] bg-[linear-gradient(180deg,#eef0f3,#d5d9df)] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)]">
          <PiHardDrivesFill aria-hidden className="size-11 text-[#5b6170]" />
        </span>
        <h2 className="mt-5 text-[20px] font-bold">Belum ada akun Drive</h2>
        <p className="mt-2 text-[14px] text-ink-2">
          Sambungkan akun Google pertama Anda. Izin yang diminta tidak membuka file Anda yang sudah ada; aplikasi hanya membaca kuota penyimpanan.
        </p>
        <a href="/api/google/connect" className="btn btn-primary mt-6">
          <PiGoogleLogoBold aria-hidden />
          Sambungkan akun Google
        </a>
      </div>
    </>
  );
}
