import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "node:fs";
import path from "node:path";

interface Store {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
}

const PREFIX = "dm:";

function upstash(url: string, token: string): Store {
  const redis = new Redis({ url, token });
  return {
    get: (k) => redis.get(PREFIX + k),
    set: async (k, v) => void (await redis.set(PREFIX + k, v)),
    del: async (k) => void (await redis.del(PREFIX + k)),
  };
}

// Untuk development lokal saja: satu file JSON di .data/.
function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "db.json");
  async function load(): Promise<Record<string, unknown>> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  }
  async function save(db: Record<string, unknown>) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(db, null, 2));
  }
  return {
    get: async <T,>(k: string) => ((await load())[k] as T) ?? null,
    set: async (k, v) => {
      const db = await load();
      db[k] = v;
      await save(db);
    },
    del: async (k) => {
      const db = await load();
      delete db[k];
      await save(db);
    },
  };
}

function create(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return upstash(url, token);
  if (process.env.VERCEL) throw new Error("Upstash Redis belum dihubungkan ke project Vercel ini.");
  return fileStore();
}

let instance: Store | undefined;
export function store(): Store {
  return (instance ??= create());
}
