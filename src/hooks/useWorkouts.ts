import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { WorkoutEntry } from "@/types/workout";

const STORAGE_KEY = "fittrack.workouts.v1";

type DbRow = {
  id: string;
  date: string;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: number | string;
  rest_min: number | string;
  notes: string | null;
  created_at: string;
};

const fromRow = (r: DbRow): WorkoutEntry => ({
  id: r.id,
  date: r.date,
  exercise: r.exercise,
  category: r.category,
  sets: r.sets,
  reps: r.reps,
  weight: Number(r.weight),
  restMin: Number(r.rest_min),
  notes: r.notes ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
});

export function useWorkouts() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from("workouts")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });
        if (!cancelled) {
          if (error) {
            console.error(error);
            setEntries([]);
          } else {
            setEntries((data as DbRow[]).map(fromRow));
          }
          setLoading(false);
        }
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          setEntries(raw ? (JSON.parse(raw) as WorkoutEntry[]) : []);
        } catch {
          setEntries([]);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Persist locally only when logged out
  useEffect(() => {
    if (!user && !authLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, user, authLoading]);

  const addEntry = useCallback(
    async (entry: Omit<WorkoutEntry, "id" | "createdAt">) => {
      if (user) {
        const { data, error } = await supabase
          .from("workouts")
          .insert({
            user_id: user.id,
            date: entry.date,
            exercise: entry.exercise,
            category: entry.category,
            sets: entry.sets,
            reps: entry.reps,
            weight: entry.weight,
            rest_min: entry.restMin,
            notes: entry.notes ?? null,
          })
          .select()
          .single();
        if (error) {
          console.error(error);
          return;
        }
        setEntries((prev) => [fromRow(data as DbRow), ...prev]);
      } else {
        const newEntry: WorkoutEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        setEntries((prev) => [newEntry, ...prev]);
      }
    },
    [user],
  );

  const addEntries = useCallback(
    async (newEntries: Omit<WorkoutEntry, "id" | "createdAt">[]) => {
      if (user) {
        const rows = newEntries.map((e) => ({
          user_id: user.id,
          date: e.date,
          exercise: e.exercise,
          category: e.category,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          rest_min: e.restMin,
          notes: e.notes ?? null,
        }));
        const { data, error } = await supabase
          .from("workouts")
          .insert(rows)
          .select();
        if (error) {
          console.error(error);
          return;
        }
        const built = (data as DbRow[]).map(fromRow);
        setEntries((prev) => [...built, ...prev]);
      } else {
        const now = Date.now();
        const built: WorkoutEntry[] = newEntries.map((e, i) => ({
          ...e,
          id: crypto.randomUUID(),
          createdAt: now + i,
        }));
        setEntries((prev) => [...built, ...prev]);
      }
    },
    [user],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (user) {
        const { error } = await supabase.from("workouts").delete().eq("id", id);
        if (error) {
          console.error(error);
          return;
        }
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [user],
  );

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Omit<WorkoutEntry, "id" | "createdAt">,
    ) => {
      if (user) {
        const { error } = await supabase
          .from("workouts")
          .update({
            date: updates.date,
            exercise: updates.exercise,
            category: updates.category,
            sets: updates.sets,
            reps: updates.reps,
            weight: updates.weight,
            rest_min: updates.restMin,
            notes: updates.notes ?? null,
          })
          .eq("id", id);
        if (error) {
          console.error(error);
          return;
        }
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [user],
  );

  const clearAll = () => setEntries([]);

  return {
    entries,
    loading,
    addEntry,
    addEntries,
    removeEntry,
    updateEntry,
    clearAll,
  };
}
