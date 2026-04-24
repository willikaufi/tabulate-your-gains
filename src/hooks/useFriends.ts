import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Friendship, Profile } from "@/types/social";

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type ProfileRow = { id: string; username: string; display_name: string | null };

const profileFromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name ?? undefined,
});

export function useFriends() {
  const { user, loading: authLoading } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setFriendships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("friendships")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setFriendships([]);
      setLoading(false);
      return;
    }
    const fr = (rows ?? []) as FriendshipRow[];
    const otherIds = Array.from(
      new Set(
        fr.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id,
        ),
      ),
    );
    let profilesById = new Map<string, Profile>();
    if (otherIds.length > 0) {
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", otherIds);
      if (pErr) console.error(pErr);
      profilesById = new Map(
        ((profs ?? []) as ProfileRow[]).map((p) => [p.id, profileFromRow(p)]),
      );
    }
    const built: Friendship[] = fr.map((f) => {
      const otherId =
        f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return {
        id: f.id,
        requesterId: f.requester_id,
        addresseeId: f.addressee_id,
        status: f.status,
        createdAt: new Date(f.created_at).getTime(),
        other: profilesById.get(otherId) ?? {
          id: otherId,
          username: "unknown",
        },
        outgoing: f.requester_id === user.id,
      };
    });
    setFriendships(built);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("friendships-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const sendRequest = useCallback(
    async (username: string) => {
      if (!user) return { error: "Nicht angemeldet" };
      const trimmed = username.trim().toLowerCase().replace(/^@/, "");
      if (!trimmed) return { error: "Benutzername fehlt" };

      const { data: target, error: pErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", trimmed)
        .maybeSingle();
      if (pErr) return { error: pErr.message };
      if (!target) return { error: "Benutzer nicht gefunden" };
      if (target.id === user.id)
        return { error: "Du kannst dich nicht selbst hinzufügen" };

      // Check existing in either direction
      const { data: existing } = await supabase
        .from("friendships")
        .select("id, status, requester_id, addressee_id")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`,
        )
        .maybeSingle();

      if (existing) {
        if (existing.status === "accepted")
          return { error: "Ihr seid bereits Freunde" };
        if (existing.status === "pending")
          return { error: "Anfrage ist bereits offen" };
        // declined → re-request: delete and recreate
        await supabase.from("friendships").delete().eq("id", existing.id);
      }

      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: target.id,
        status: "pending",
      });
      if (error) return { error: error.message };
      await load();
      return { error: null };
    },
    [user, load],
  );

  const respondRequest = useCallback(
    async (id: string, accept: boolean) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", id);
      if (error) return { error: error.message };
      await load();
      return { error: null };
    },
    [load],
  );

  const removeFriendship = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", id);
      if (error) return { error: error.message };
      setFriendships((prev) => prev.filter((f) => f.id !== id));
      return { error: null };
    },
    [],
  );

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter(
    (f) => f.status === "pending" && !f.outgoing,
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.outgoing,
  );

  return {
    friendships,
    accepted,
    incoming,
    outgoing,
    loading,
    sendRequest,
    respondRequest,
    removeFriendship,
    reload: load,
  };
}
