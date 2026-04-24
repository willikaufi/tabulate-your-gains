import { useMemo, useState } from "react";
import { Search, Trash2, Dumbbell, Pencil, Share2 } from "lucide-react";
import { EditWorkoutDialog } from "@/components/EditWorkoutDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, type WorkoutEntry } from "@/types/workout";
import type { SharedSessionPayload } from "@/types/social";

interface Props {
  entries: WorkoutEntry[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Omit<WorkoutEntry, "id" | "createdAt">) => void;
}

export function WorkoutTable({ entries, onRemove, onUpdate }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editing, setEditing] = useState<WorkoutEntry | null>(null);
  const [sharingDate, setSharingDate] = useState<string | null>(null);

  const sharePayload = useMemo<SharedSessionPayload | null>(() => {
    if (!sharingDate) return null;
    const dayEntries = entries.filter((e) => e.date === sharingDate);
    return {
      date: sharingDate,
      entries: dayEntries.map((e) => ({
        date: e.date,
        exercise: e.exercise,
        category: e.category,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        restMin: e.restMin,
        notes: e.notes,
      })),
    };
  }, [sharingDate, entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesQuery =
        !query ||
        e.exercise.toLowerCase().includes(query.toLowerCase()) ||
        e.notes?.toLowerCase().includes(query.toLowerCase());
      const matchesCat =
        filterCategory === "all" || e.category === filterCategory;
      return matchesQuery && matchesCat;
    });
  }, [entries, query, filterCategory]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="rounded-2xl border border-border bg-gradient-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold">Verlauf</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Übung suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 sm:w-56"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-secondary p-4">
            <Dumbbell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {entries.length === 0
              ? "Noch keine Einträge — leg los und tracke dein erstes Workout!"
              : "Keine Einträge passen zu deinen Filtern."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Datum</TableHead>
                <TableHead>Übung</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead className="text-right">Sätze</TableHead>
                <TableHead className="text-right">Wiederholungen</TableHead>
                <TableHead className="text-right">Gewicht</TableHead>
                <TableHead className="text-right">Satzpause</TableHead>
                <TableHead className="text-right">Volumen</TableHead>
                <TableHead>Notizen</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatDate(e.date)}
                  </TableCell>
                  <TableCell className="font-medium">{e.exercise}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground"
                    >
                      {e.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.sets}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.reps}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.weight} kg
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {e.restMin ?? 0} min
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-primary">
                    {(e.sets * e.reps * e.weight).toLocaleString("de-DE")} kg
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {e.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(e)}
                        className="hover:text-primary"
                        aria-label="Eintrag bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(e.id)}
                        className="hover:text-destructive"
                        aria-label="Eintrag löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditWorkoutDialog
        entry={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={onUpdate}
      />
    </div>
  );
}
