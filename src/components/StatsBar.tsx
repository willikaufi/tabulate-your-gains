import { Activity, Dumbbell, Flame, TrendingUp } from "lucide-react";
import type { WorkoutEntry } from "@/types/workout";

interface Props {
  entries: WorkoutEntry[];
}

export function StatsBar({ entries }: Props) {
  const totalSessions = new Set(entries.map((e) => e.date)).size;
  const totalEntries = entries.length;
  const totalVolume = entries.reduce(
    (sum, e) => sum + e.sets * e.reps * e.weight,
    0,
  );
  const last7 = entries.filter((e) => {
    const d = new Date(e.date).getTime();
    return d >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  const stats = [
    {
      icon: Activity,
      label: "Trainingstage",
      value: totalSessions.toString(),
    },
    {
      icon: Dumbbell,
      label: "Einträge",
      value: totalEntries.toString(),
    },
    {
      icon: TrendingUp,
      label: "Gesamt-Volumen",
      value: `${totalVolume.toLocaleString("de-DE")} kg`,
    },
    {
      icon: Flame,
      label: "Letzte 7 Tage",
      value: last7.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-gradient-surface p-4 shadow-card"
        >
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <s.icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {s.label}
            </span>
          </div>
          <div className="font-display text-2xl font-semibold">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
