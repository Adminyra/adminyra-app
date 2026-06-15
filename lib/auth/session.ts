import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("AUTH CHECK:", {
    hasUser: Boolean(user),
    email: user?.email ?? null,
    error: error?.message ?? null,
  });

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    console.log("AUTH CHECK: redirecting to /login");
    redirect("/login");
  }

  return user;
}