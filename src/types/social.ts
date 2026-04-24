import type { PlanExercise, WorkoutEntry } from "./workout";

export interface Profile {
  id: string;
  username: string;
  displayName?: string;
}

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: number;
  // The "other" user in the relationship (not the current user)
  other: Profile;
  // True when current user sent the request, false when received
  outgoing: boolean;
}

export type SharedItemKind = "plan" | "session";

export interface SharedPlanPayload {
  name: string;
  description?: string;
  exercises: PlanExercise[];
}

export interface SharedSessionPayload {
  date: string;
  entries: Omit<WorkoutEntry, "id" | "createdAt">[];
}

export interface SharedItem {
  id: string;
  senderId: string;
  recipientId: string;
  kind: SharedItemKind;
  title: string;
  note?: string;
  payload: SharedPlanPayload | SharedSessionPayload;
  createdAt: number;
  sender?: Profile;
  recipient?: Profile;
  outgoing: boolean;
}
