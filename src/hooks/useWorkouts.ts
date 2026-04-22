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

  const addEntries = (newEntries: Omit<WorkoutEntry, "id" | "createdAt">[]) => {
    const now = Date.now();
    const built: WorkoutEntry[] = newEntries.map((e, i) => ({
      ...e,
      id: crypto.randomUUID(),
      createdAt: now + i,
    }));
    setEntries((prev) => [...built, ...prev]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (
    id: string,
    updates: Omit<WorkoutEntry, "id" | "createdAt">,
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  };

  const clearAll = () => setEntries([]);

  return { entries, addEntry, removeEntry, updateEntry, clearAll };
}
