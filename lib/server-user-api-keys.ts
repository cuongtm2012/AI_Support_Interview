import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getUserDeepgramKey(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_api_keys")
    .select("deepgram_api_key")
    .eq("user_id", user.id)
    .maybeSingle();

  const key = data?.deepgram_api_key?.trim();
  return key || null;
}

export async function getUserDeepseekKey(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_api_keys")
    .select("deepseek_api_key")
    .eq("user_id", user.id)
    .maybeSingle();

  const key = data?.deepseek_api_key?.trim();
  return key || null;
}
