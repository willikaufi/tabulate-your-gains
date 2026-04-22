import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  CATEGORIES,
  type PlanExercise,
  type WorkoutPlan,
} from "@/types/workout";
import { toast } from "sonner";

interface Props {
  plan: WorkoutPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (plan: Omit<WorkoutPlan, "id" | "createdAt">) => void;
  onUpdate: (id: string, plan: Omit<WorkoutPlan, "id" | "createdAt">) => void;
}

const emptyExercise = (): PlanExercise => ({
  id: crypto.randomUUID(),
  exercise: "",
  category: "Brust",
  sets: 3,
  reps: 10,
  weight: 0,
});

export function PlanDialog({
  plan,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<PlanExercise[]>([emptyExercise()]);

  useEffect(() => {
    if (open) {
      if (plan) {
        setName(plan.name);
        setDescription(plan.description ?? "");
        setExercises(plan.exercises.length ? plan.exercises : [emptyExercise()]);
      } else {
        setName("");
        setDescription("");
        setExercises([emptyExercise()]);
      }
    }
  }, [plan, open]);

  const updateExercise = <K extends keyof PlanExercise>(
    id: string,
    key: K,
    value: PlanExercise[K],
  ) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [key]: value } : e)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Bitte gib dem Plan einen Namen.");
      return;
    }
    const cleaned = exercises
      .filter((ex) => ex.exercise.trim())
      .map((ex) => ({ ...ex, exercise: ex.exercise.trim() }));
    if (cleaned.length === 0) {
      toast.error("Füge mindestens eine Übung hinzu.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: cleaned,
    };
    if (plan) {
      onUpdate(plan.id, payload);
      toast.success("Plan aktualisiert");
    } else {
      onCreate(payload);
      toast.success("Plan erstellt");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {plan ? "Plan bearbeiten" : "Neuen Trainingsplan erstellen"}
          </DialogTitle>
          <DialogDescription>
            Definiere wiederkehrende Übungen — füge sie später mit einem Klick
            in dein Logbuch ein.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                placeholder="z.B. Push Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-desc">Beschreibung (optional)</Label>
              <Input
                id="plan-desc"
                placeholder="Kurz, was dieser Plan abdeckt"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Übungen</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setExercises((prev) => [...prev, emptyExercise()])
                }
              >
                <Plus className="h-4 w-4" />
                Übung
              </Button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="rounded-xl border border-border bg-secondary/40 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Übung {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExercises((prev) =>
                          prev.length === 1
                            ? prev
                            : prev.filter((p) => p.id !== ex.id),
                        )
                      }
                      className="h-7 w-7 hover:text-destructive"
                      aria-label="Übung entfernen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="Übung"
                        value={ex.exercise}
                        onChange={(e) =>
                          updateExercise(ex.id, "exercise", e.target.value)
                        }
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Select
                        value={ex.category}
                        onValueChange={(v) =>
                          updateExercise(ex.id, "category", v)
                        }
                      >
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
                    <Input
                      type="number"
                      min={0}
                      placeholder="Sätze"
                      value={ex.sets}
                      onChange={(e) =>
                        updateExercise(ex.id, "sets", Number(e.target.value) || 0)
                      }
                      className="sm:col-span-2"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Wdh."
                      value={ex.reps}
                      onChange={(e) =>
                        updateExercise(ex.id, "reps", Number(e.target.value) || 0)
                      }
                      className="sm:col-span-2"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="kg"
                      value={ex.weight}
                      onChange={(e) =>
                        updateExercise(
                          ex.id,
                          "weight",
                          Number(e.target.value) || 0,
                        )
                      }
                      className="sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
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
              {plan ? "Speichern" : "Plan erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
