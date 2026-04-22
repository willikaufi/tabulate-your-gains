import { useEffect, useState } from "react";
import type { WorkoutPlan } from "@/types/workout";

const STORAGE_KEY = "fittrack.plans.v1";

export function usePlans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WorkoutPlan[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  const addPlan = (plan: Omit<WorkoutPlan, "id" | "createdAt">) => {
    const newPlan: WorkoutPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  };

  const updatePlan = (
    id: string,
    updates: Omit<WorkoutPlan, "id" | "createdAt">,
  ) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const removePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return { plans, addPlan, updatePlan, removePlan };
}
