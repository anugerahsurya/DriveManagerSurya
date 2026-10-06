import { PhoneChecklist } from "@/components/phone-checklist";
import { PageHeader } from "@/components/shell/page-header";
import { listAccounts } from "@/lib/accounts";

export const metadata = { title: "Nomor HP" };

export default async function PhonePage() {
  const accounts = await listAccounts();
  return (
    <>
      <PageHeader title="Ganti nomor HP" subtitle="Satu daftar untuk semua akun" />
      <div className="mx-auto max-w-[760px] px-4 pt-2 md:px-8 md:pt-7">
        <PhoneChecklist accounts={accounts} />
      </div>
    </>
  );
}
