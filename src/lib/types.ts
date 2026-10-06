// Tipe yang aman dikirim ke browser (tanpa token).

export type Quota = {
  limit: number | null;
  usage: number;
  drive: number;
  trash: number;
  at: number;
};

export type LinkedApp = { id: string; name: string; note?: string; at: number };

export type Avatar = { key: string; bg: string };

export type AccountView = {
  id: string;
  email: string;
  googleName: string;
  nickname?: string;
  note?: string;
  avatar?: Avatar;
  slot: number;
  connectedAt: number;
  quota?: Quota;
  quotaError?: string;
  phoneDoneAt?: number | null;
  apps: LinkedApp[];
};

export type Snapshot = { d: string; u: number; l: number | null };

/** Blob brankas. Semua isi terenkripsi di browser; server tidak bisa membacanya. */
export type VaultBlob = {
  v: 1;
  salt: string;
  iter: number;
  deviceHash: string;
  check: { iv: string; ct: string };
  data: { iv: string; ct: string };
  updatedAt: number;
};
