export const hasLovableCloudEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export async function getLovableCloudClient() {
  if (!hasLovableCloudEnv) {
    throw new Error("Lovable Cloud is still connecting. Refresh the preview in a moment.");
  }

  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}