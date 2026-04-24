import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types/social";

type Row = {
  id: string;
  username: string;
  display_name: string | null;
};

const fromRow = (r: Row): Profile => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name ?? undefined,
});

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) {
        if (error) console.error(error);
        setProfile(data ? fromRow(data as Row) : null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const updateProfile = useCallback(
    async (updates: { username?: string; displayName?: string }) => {
      if (!user) return { error: "not authenticated" as const };
      const payload: Record<string, string | null> = {};
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.displayName !== undefined)
        payload.display_name = updates.displayName || null;

      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("id, username, display_name")
        .single();
      if (error) return { error: error.message };
      setProfile(fromRow(data as Row));
      return { error: null };
    },
    [user],
  );

  return { profile, loading, updateProfile };
}
