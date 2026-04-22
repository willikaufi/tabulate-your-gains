import { Dumbbell } from "lucide-react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { WorkoutForm } from "@/components/WorkoutForm";
import { WorkoutTable } from "@/components/WorkoutTable";
import { StatsBar } from "@/components/StatsBar";

const Index = () => {
  const { entries, addEntry, removeEntry, updateEntry } = useWorkouts();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-glow" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Fit<span className="text-gradient">Track</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Dein Trainings-Logbuch
              </p>
            </div>
          </div>
        </header>

        <section className="mb-10 max-w-2xl">
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Tracke jedes Set.{" "}
            <span className="text-gradient">Werde stärker.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Erfasse Übungen, Sätze, Wiederholungen und Gewicht. Behalte deinen
            Fortschritt im Blick — alles übersichtlich in einer Tabelle.
          </p>
        </section>

        <div className="mb-8">
          <StatsBar entries={entries} />
        </div>

        <div className="mb-8">
          <WorkoutForm onAdd={addEntry} />
        </div>

        <WorkoutTable entries={entries} onRemove={removeEntry} onUpdate={updateEntry} />

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Daten werden lokal in deinem Browser gespeichert.
        </footer>
      </div>
    </div>
  );
};

export default Index;
