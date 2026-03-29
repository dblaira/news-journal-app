import { createClient } from "@supabase/supabase-js";

// Note: This client bypasses Row Level Security (RLS).
// Only use it in secure server-side API routes.
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
