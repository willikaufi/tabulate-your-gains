import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  Profile,
  SharedItem,
  SharedItemKind,
  SharedPlanPayload,
  SharedSessionPayload,
} from "@/types/social";

type Row = {
  id: string;
  sender_id: string;
  recipient_id: string;
  kind: SharedItemKind;
  title: string;
  note: string | null;
  payload: SharedPlanPayload | SharedSessionPayload;
  created_at: string;
};

type ProfileRow = { id: string; username: string; display_name: string | null };

const profileFromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name ?? undefined,
});

export function useShared() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("shared_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setItems([]);
      setLoading(false);
      return;
    }
    const list = (rows ?? []) as unknown as Row[];
    const ids = Array.from(
      new Set(list.flatMap((r) => [r.sender_id, r.recipient_id])),
    );
    let map = new Map<string, Profile>();
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", ids);
      map = new Map(
        ((profs ?? []) as ProfileRow[]).map((p) => [p.id, profileFromRow(p)]),
      );
    }
    setItems(
      list.map((r) => ({
        id: r.id,
        senderId: r.sender_id,
        recipientId: r.recipient_id,
        kind: r.kind,
        title: r.title,
        note: r.note ?? undefined,
        payload: r.payload,
        createdAt: new Date(r.created_at).getTime(),
        sender: map.get(r.sender_id),
        recipient: map.get(r.recipient_id),
        outgoing: r.sender_id === user.id,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`shared-items-changes-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_items" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const share = useCallback(
    async (input: {
      recipientId: string;
      kind: SharedItemKind;
      title: string;
      note?: string;
      payload: SharedPlanPayload | SharedSessionPayload;
    }) => {
      if (!user) return { error: "Nicht angemeldet" };
      const { error } = await supabase.from("shared_items").insert({
        sender_id: user.id,
        recipient_id: input.recipientId,
        kind: input.kind,
        title: input.title,
        note: input.note ?? null,
        payload: input.payload as unknown as never,
      });
      if (error) return { error: error.message };
      await load();
      return { error: null };
    },
    [user, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("shared_items")
        .delete()
        .eq("id", id);
      if (error) return { error: error.message };
      setItems((prev) => prev.filter((i) => i.id !== id));
      return { error: null };
    },
    [],
  );

  const incoming = items.filter((i) => !i.outgoing);
  const outgoing = items.filter((i) => i.outgoing);

  return { items, incoming, outgoing, loading, share, remove, reload: load };
}
