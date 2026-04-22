export interface WorkoutEntry {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: number; // in kg
  notes?: string;
  createdAt: number;
}

export interface PlanExercise {
  id: string;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  exercises: PlanExercise[];
  createdAt: number;
}

export const CATEGORIES = [
  "Brust",
  "Rücken",
  "Beine",
  "Schultern",
  "Arme",
  "Core",
  "Cardio",
  "Sonstiges",
] as const;
