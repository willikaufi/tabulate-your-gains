import { useState } from "react";
import {
  ClipboardList,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Zap,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PlanDialog } from "@/components/PlanDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import type { WorkoutEntry, WorkoutPlan } from "@/types/workout";
import type { SharedPlanPayload } from "@/types/social";
import { toast } from "sonner";

interface Props {
  onApply: (entries: Omit<WorkoutEntry, "id" | "createdAt">[]) => void;
}

export function PlansSection({ onApply }: Props) {
  const { plans, addPlan, updatePlan, removePlan } = usePlans();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [sharingPlan, setSharingPlan] = useState<WorkoutPlan | null>(null);

  const openCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const openEdit = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const applyPlan = (plan: WorkoutPlan, date: string) => {
    const entries = plan.exercises.map((ex) => ({
      date,
      exercise: ex.exercise,
      category: ex.category,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      restMin: ex.restMin ?? 0,
      notes: `Aus Plan: ${plan.name}`,
    }));
    onApply(entries);
    toast.success(`${entries.length} Einträge eingefügt`, {
      description: plan.name,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">
              Trainingspläne
            </h2>
            <p className="text-xs text-muted-foreground">
              Vorlagen für wiederkehrende Workouts
            </p>
          </div>
        </div>
        <Button onClick={openCreate} variant="hero" size="sm">
          <Plus className="h-4 w-4" />
          Neuer Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="rounded-full bg-secondary p-4">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Noch keine Pläne. Erstelle deinen ersten Plan, um Workouts mit
            einem Klick einzufügen.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              canShare={!!user}
              onEdit={() => openEdit(plan)}
              onShare={() => setSharingPlan(plan)}
              onRemove={() => {
                removePlan(plan.id);
                toast.success("Plan gelöscht");
              }}
              onApply={(date) => applyPlan(plan, date)}
            />
          ))}
        </div>
      )}

      <PlanDialog
        plan={editingPlan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={addPlan}
        onUpdate={updatePlan}
      />

      <ShareDialog
        open={sharingPlan !== null}
        onOpenChange={(open) => !open && setSharingPlan(null)}
        kind="plan"
        title={sharingPlan?.name ?? ""}
        payload={
          sharingPlan
            ? ({
                name: sharingPlan.name,
                description: sharingPlan.description,
                exercises: sharingPlan.exercises,
              } satisfies SharedPlanPayload)
            : null
        }
      />
    </div>
  );
}

function PlanCard({
  plan,
  canShare,
  onEdit,
  onShare,
  onRemove,
  onApply,
}: {
  plan: WorkoutPlan;
  canShare: boolean;
  onEdit: () => void;
  onShare: () => void;
  onRemove: () => void;
  onApply: (date: string) => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background/40 p-4 transition-smooth hover:border-primary/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="truncate text-xs text-muted-foreground">
              {plan.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canShare && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-primary"
              onClick={onShare}
              aria-label="Plan teilen"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-primary"
            onClick={onEdit}
            aria-label="Plan bearbeiten"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={onRemove}
            aria-label="Plan löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {plan.exercises.length} Übungen
        </Badge>
        {Array.from(new Set(plan.exercises.map((e) => e.category)))
          .slice(0, 3)
          .map((c) => (
            <Badge key={c} variant="secondary">
              {c}
            </Badge>
          ))}
      </div>

      <ul className="mb-4 space-y-1 text-xs text-muted-foreground">
        {plan.exercises.slice(0, 3).map((ex) => (
          <li key={ex.id} className="flex justify-between gap-2">
            <span className="truncate">{ex.exercise}</span>
            <span className="shrink-0 tabular-nums">
              {ex.sets}×{ex.reps} · {ex.weight}kg · {ex.restMin}min
            </span>
          </li>
        ))}
        {plan.exercises.length > 3 && (
          <li className="text-muted-foreground/70">
            +{plan.exercises.length - 3} weitere
          </li>
        )}
      </ul>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="hero" size="sm" className="mt-auto w-full">
            <Zap className="h-4 w-4" />
            Einfügen
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`apply-date-${plan.id}`} className="text-xs">
                <CalendarIcon className="mr-1 inline h-3 w-3" />
                Datum
              </Label>
              <Input
                id={`apply-date-${plan.id}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button
              variant="hero"
              size="sm"
              className="w-full"
              onClick={() => {
                onApply(date);
                setOpen(false);
              }}
            >
              {plan.exercises.length} Einträge hinzufügen
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
