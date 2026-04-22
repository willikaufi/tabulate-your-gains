import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  onAdd: (entry: Omit<WorkoutEntry, "id" | "createdAt">) => void;
}

export function WorkoutForm({ onAdd }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [exercise, setExercise] = useState("");
  const [category, setCategory] = useState<string>("Brust");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [restMin, setRestMin] = useState("2");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim()) {
      toast.error("Bitte gib eine Übung an.");
      return;
    }
    onAdd({
      date,
      exercise: exercise.trim(),
      category,
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weight: Number(weight) || 0,
      restMin: Number(restMin) || 0,
      notes: notes.trim() || undefined,
    });
    toast.success("Eintrag gespeichert", {
      description: `${exercise} • ${sets}×${reps} @ ${weight} kg`,
    });
    setExercise("");
    setNotes("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-gradient-surface p-6 shadow-card"
    >
      <h2 className="mb-5 font-display text-xl font-semibold">Neuer Eintrag</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Datum</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="exercise">Übung</Label>
          <Input
            id="exercise"
            placeholder="z.B. Bankdrücken"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
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

        <div className="space-y-2">
          <Label htmlFor="sets">Sätze</Label>
          <Input
            id="sets"
            type="number"
            min={0}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reps">Wiederholungen</Label>
          <Input
            id="reps"
            type="number"
            min={0}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Gewicht (kg)</Label>
          <Input
            id="weight"
            type="number"
            min={0}
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rest">Satzpause (min)</Label>
          <Input
            id="rest"
            type="number"
            min={0}
            step="0.5"
            value={restMin}
            onChange={(e) => setRestMin(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label htmlFor="notes">Notizen (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Wie hat es sich angefühlt?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={1}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="hero" size="lg">
          <Plus className="h-4 w-4" />
          Eintrag hinzufügen
        </Button>
      </div>
    </form>
  );
}
