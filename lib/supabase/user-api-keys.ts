import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUserApiKeysStore } from "@/stores/user-api-keys";

export interface UserApiKeys {
  deepgramApiKey: string;
  deepseekApiKey: string;
}

const LEGACY_STORAGE_KEY = "interview-copilot-settings";

function readLegacyLocalKeys(): Partial<UserApiKeys> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      state?: { deepgramApiKey?: string; deepseekApiKey?: string };
    };
    return {
      deepgramApiKey: parsed.state?.deepgramApiKey?.trim() ?? "",
      deepseekApiKey: parsed.state?.deepseekApiKey?.trim() ?? "",
    };
  } catch {
    return {};
  }
}

function stripLegacyLocalKeys(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      state?: Record<string, unknown>;
      version?: number;
    };
    if (!parsed.state) return;
    delete parsed.state.deepgramApiKey;
    delete parsed.state.deepseekApiKey;
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export async function fetchUserApiKeys(
  userId: string
): Promise<UserApiKeys | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("deepgram_api_key, deepseek_api_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[user_api_keys] fetch failed", error.message);
    return null;
  }

  return {
    deepgramApiKey: data?.deepgram_api_key?.trim() ?? "",
    deepseekApiKey: data?.deepseek_api_key?.trim() ?? "",
  };
}

export async function saveUserApiKeys(
  userId: string,
  keys: UserApiKeys
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase chưa được cấu hình." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("user_api_keys").upsert(
    {
      user_id: userId,
      deepgram_api_key: keys.deepgramApiKey.trim() || null,
      deepseek_api_key: keys.deepseekApiKey.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Load keys into store; migrate legacy localStorage keys on first login. */
export async function syncUserApiKeysForUser(userId: string): Promise<void> {
  const store = useUserApiKeysStore.getState();
  const remote = await fetchUserApiKeys(userId);

  if (!remote) {
    store.setLoaded(true);
    return;
  }

  const legacy = readLegacyLocalKeys();
  const hasRemote =
    !!remote.deepgramApiKey.trim() || !!remote.deepseekApiKey.trim();
  const hasLegacy =
    !!legacy.deepgramApiKey?.trim() || !!legacy.deepseekApiKey?.trim();

  if (!hasRemote && hasLegacy) {
    const merged: UserApiKeys = {
      deepgramApiKey: legacy.deepgramApiKey ?? "",
      deepseekApiKey: legacy.deepseekApiKey ?? "",
    };
    await saveUserApiKeys(userId, merged);
    stripLegacyLocalKeys();
    store.setKeys(merged);
    store.setLoaded(true);
    return;
  }

  store.setKeys(remote);
  if (hasLegacy) stripLegacyLocalKeys();
  store.setLoaded(true);
}

export function clearUserApiKeysFromStore(): void {
  useUserApiKeysStore.getState().clearKeys();
}
