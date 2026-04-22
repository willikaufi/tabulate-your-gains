import { useEffect, useState } from "react";
import type { WorkoutEntry } from "@/types/workout";

const STORAGE_KEY = "fittrack.workouts.v1";

export function useWorkouts() {
  const [entries, setEntries] = useState<WorkoutEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WorkoutEntry[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry: Omit<WorkoutEntry, "id" | "createdAt">) => {
    const newEntry: WorkoutEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = () => setEntries([]);

  return { entries, addEntry, removeEntry, clearAll };
}
