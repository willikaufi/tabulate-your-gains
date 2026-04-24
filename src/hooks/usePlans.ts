import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { WorkoutPlan, PlanExercise } from "@/types/workout";

const STORAGE_KEY = "fittrack.plans.v1";

type DbRow = {
  id: string;
  name: string;
  description: string | null;
  exercises: PlanExercise[] | null;
  created_at: string;
};

const fromRow = (r: DbRow): WorkoutPlan => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  exercises: (r.exercises ?? []) as PlanExercise[],
  createdAt: new Date(r.created_at).getTime(),
});

export function usePlans() {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      if (user) {
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .order("created_at", { ascending: false });
        if (!cancelled) {
          if (error) console.error(error);
          else setPlans((data as unknown as DbRow[]).map(fromRow));
        }
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          setPlans(raw ? (JSON.parse(raw) as WorkoutPlan[]) : []);
        } catch {
          setPlans([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!user && !authLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    }
  }, [plans, user, authLoading]);

  const addPlan = useCallback(
    async (plan: Omit<WorkoutPlan, "id" | "createdAt">) => {
      if (user) {
        const { data, error } = await supabase
          .from("plans")
          .insert({
            user_id: user.id,
            name: plan.name,
            description: plan.description ?? null,
            exercises: plan.exercises as unknown as never,
          })
          .select()
          .single();
        if (error) {
          console.error(error);
          return null;
        }
        const newPlan = fromRow(data as unknown as DbRow);
        setPlans((prev) => [newPlan, ...prev]);
        return newPlan;
      }
      const newPlan: WorkoutPlan = {
        ...plan,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      setPlans((prev) => [newPlan, ...prev]);
      return newPlan;
    },
    [user],
  );

  const updatePlan = useCallback(
    async (
      id: string,
      updates: Omit<WorkoutPlan, "id" | "createdAt">,
    ) => {
      if (user) {
        const { error } = await supabase
          .from("plans")
          .update({
            name: updates.name,
            description: updates.description ?? null,
            exercises: updates.exercises as unknown as never,
          })
          .eq("id", id);
        if (error) {
          console.error(error);
          return;
        }
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [user],
  );

  const removePlan = useCallback(
    async (id: string) => {
      if (user) {
        const { error } = await supabase.from("plans").delete().eq("id", id);
        if (error) {
          console.error(error);
          return;
        }
      }
      setPlans((prev) => prev.filter((p) => p.id !== id));
    },
    [user],
  );

  return { plans, addPlan, updatePlan, removePlan };
}
