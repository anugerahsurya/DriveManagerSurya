import { notFound } from "next/navigation";
import {
  PiArrowSquareOutBold,
  PiCloudFill,
  PiHardDrivesFill,
  PiPhoneFill,
  PiPlugsConnectedFill,
  PiShieldCheckFill,
  PiWarningCircleFill,
} from "react-icons/pi";
import { Avatar } from "@/components/avatar";
import { DisconnectButton, EditProfileButton, LinkedApps } from "@/components/account-parts";
import { RefreshButton } from "@/components/refresher";
import { SegmentBar, SegmentLegend } from "@/components/segment-bar";
import { PageHeader } from "@/components/shell/page-header";
import { TrendChart } from "@/components/trend-chart";
import { getAccount, getSnapshots } from "@/lib/accounts";
import { ago, bytes, dateLong, displayName, googleLinks, level, pct, percent } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/akun/[id]">) {
  const a = await getAccount((await params).id);
  return { title: a ? displayName(a) : "Akun" };
}

export default async function AccountPage({ params }: PageProps<"/akun/[id]">) {
  const { id } = await params;
  const [account, snaps] = await Promise.all([getAccount(id), getSnapshots(id)]);
  if (!account) notFound();
  const a = account;
  const q = a.quota;
  const p = q ? percent(q.usage, q.limit) : null;
  const lv = level(a);
  // usageInDrive sudah termasuk sampah; sisanya dipakai Gmail & Google Foto.
  const other = q ? Math.max(0, q.usage - q.drive) : 0;
  const segments = q
    ? [
        { key: "drive", label: "Drive", value: Math.max(0, q.drive - q.trash), color: "var(--s0)" },
        { key: "trash", label: "Sampah", value: q.trash, color: "var(--s1)" },
        { key: "other", label: "Gmail & Foto", value: other, color: "var(--s2)" },
      ]
    : [];

  const shortcut = (href: string, label: string, Icon: typeof PiCloudFill, tint: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group-row">
      <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] text-white" style={{ background: tint }}>
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="flex-1">{label}</span>
      <PiArrowSquareOutBold aria-hidden className="size-3.5 text-ink-3" />
    </a>
  );

  return (
    <>
      <PageHeader
        title={displayName(a)}
        subtitle={a.email}
        actions={<RefreshButton ids={[a.id]} />}
      />

      <div className="mx-auto max-w-[760px] space-y-7 px-4 pt-2 md:px-8 md:pt-7">
        {/* Identitas */}
        <section className="flex items-center gap-4 px-1">
          <Avatar account={a} size={72} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[20px] font-bold">{displayName(a)}</h2>
            <p className="truncate text-[13px] text-ink-2">{a.email}</p>
            {a.note && <p className="mt-1 line-clamp-2 text-[13px]">{a.note}</p>}
          </div>
          <EditProfileButton account={a} />
        </section>

        {a.quotaError && (
          <div className="group-box flex items-start gap-3 p-4">
            <PiWarningCircleFill aria-hidden className="mt-0.5 size-5 shrink-0 text-critical" />
            <div className="flex-1 text-[14px]">
              <p className="font-semibold">{a.quotaError}</p>
              <a href={`/api/google/connect?email=${encodeURIComponent(a.email)}`} className="btn btn-primary mt-3">
                Sambungkan ulang
              </a>
            </div>
          </div>
        )}

        <section aria-labelledby="storage">
          <h2 id="storage" className="group-title">
            Penyimpanan
          </h2>
          <div className="group-box p-4 md:p-5">
            {q ? (
              <>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <p className="tnum text-[14px]">
                    <span className="font-bold">{bytes(q.usage)}</span>
                    <span className="text-ink-2"> dari {q.limit ? bytes(q.limit) : "tanpa batas"}</span>
                  </p>
                  {p != null && (
                    <span
                      className={`tnum text-[13px] font-semibold ${
                        lv === "critical" ? "text-critical" : lv === "warn" ? "text-warning" : "text-ink-2"
                      }`}
                    >
                      {lv === "critical" ? "Hampir penuh · " : lv === "warn" ? "Mulai penuh · " : ""}
                      {pct(p)}
                    </span>
                  )}
                </div>
                <SegmentBar
                  segments={segments}
                  total={q.limit ?? q.usage}
                  label={`${bytes(q.usage)} terpakai dari ${q.limit ? bytes(q.limit) : "tanpa batas"}`}
                />
                <div className="mt-3">
                  <SegmentLegend segments={segments} free={q.limit ? Math.max(0, q.limit - q.usage) : null} />
                </div>
                <p className="mt-3 text-[12px] text-ink-2">Diperbarui {ago(q.at)}</p>
              </>
            ) : (
              <p className="text-[14px] text-ink-2">Kuota belum terbaca.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="trend">
          <h2 id="trend" className="group-title">
            Penggunaan 90 hari terakhir
          </h2>
          <div className="group-box px-2 pt-3 pb-2">
            <TrendChart data={snaps} />
          </div>
        </section>

        <section aria-labelledby="apps">
          <h2 id="apps" className="group-title">
            Aplikasi terhubung
          </h2>
          <LinkedApps accountId={a.id} apps={a.apps} connectionsUrl={googleLinks.connections(a.email)} />
          <p className="mt-2 px-1 text-[12px] text-ink-2">
            Google tidak menyediakan daftar ini lewat API untuk akun pribadi. Catat di sini, lalu cocokkan dengan daftar
            resmi di halaman Koneksi Google.
          </p>
        </section>

        <section aria-labelledby="links">
          <h2 id="links" className="group-title">
            Buka di Google
          </h2>
          <div className="group-box">
            {shortcut(googleLinks.drive(a.email), "Google Drive", PiHardDrivesFill, "#1a73e8")}
            {shortcut(googleLinks.storage(a.email), "Kelola penyimpanan", PiCloudFill, "#5f6fd6")}
            {shortcut(googleLinks.phone(a.email), "Nomor telepon", PiPhoneFill, "#1fae47")}
            {shortcut(googleLinks.connections(a.email), "Koneksi pihak ketiga", PiPlugsConnectedFill, "#f07a12")}
            {shortcut(googleLinks.security(a.email), "Keamanan akun", PiShieldCheckFill, "#5d636e")}
          </div>
        </section>

        <section className="space-y-3 pb-6">
          <p className="px-1 text-[12px] text-ink-2">Tersambung sejak {dateLong(a.connectedAt)}.</p>
          <DisconnectButton id={a.id} name={displayName(a)} />
        </section>
      </div>
    </>
  );
}
