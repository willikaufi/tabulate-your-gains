import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type WorkoutEntry } from "@/types/workout";
import { toast } from "sonner";

interface Props {
  entry: WorkoutEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Omit<WorkoutEntry, "id" | "createdAt">) => void;
}

export function EditWorkoutDialog({ entry, open, onOpenChange, onSave }: Props) {
  const [date, setDate] = useState("");
  const [exercise, setExercise] = useState("");
  const [category, setCategory] = useState<string>("Brust");
  const [sets, setSets] = useState("0");
  const [reps, setReps] = useState("0");
  const [weight, setWeight] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setExercise(entry.exercise);
      setCategory(entry.category);
      setSets(String(entry.sets));
      setReps(String(entry.reps));
      setWeight(String(entry.weight));
      setNotes(entry.notes ?? "");
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    if (!exercise.trim()) {
      toast.error("Bitte gib eine Übung an.");
      return;
    }
    onSave(entry.id, {
      date,
      exercise: exercise.trim(),
      category,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weight: Number(weight) || 0,
      notes: notes.trim() || undefined,
    });
    toast.success("Eintrag aktualisiert");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Eintrag bearbeiten
          </DialogTitle>
          <DialogDescription>
            Passe die Details deines Trainings an.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Datum</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-exercise">Übung</Label>
              <Input
                id="edit-exercise"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sets">Sätze</Label>
              <Input
                id="edit-sets"
                type="number"
                min={0}
                value={sets}
                onChange={(e) => setSets(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reps">Wiederholungen</Label>
              <Input
                id="edit-reps"
                type="number"
                min={0}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-weight">Gewicht (kg)</Label>
              <Input
                id="edit-weight"
                type="number"
                min={0}
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-notes">Notizen</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" variant="hero">
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
