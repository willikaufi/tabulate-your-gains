import { Dumbbell, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutForm } from "@/components/WorkoutForm";
import { WorkoutTable } from "@/components/WorkoutTable";
import { StatsBar } from "@/components/StatsBar";
import { PlansSection } from "@/components/PlansSection";
import { FriendsSection } from "@/components/FriendsSection";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const { entries, addEntry, addEntries, removeEntry, updateEntry } =
    useWorkouts();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Abgemeldet");
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-glow" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-10 flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-1.5 text-xs sm:flex">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[180px] truncate">{user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  aria-label="Abmelden"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Abmelden</span>
                </Button>
              </>
            ) : (
              <Button asChild variant="hero" size="sm">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  Anmelden
                </Link>
              </Button>
            )}
          </div>
        </header>

        <section className="mb-10 max-w-2xl">
          <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Tracke jedes Set.{" "}
            <span className="text-gradient">Werde stärker.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Erfasse Übungen, Sätze, Wiederholungen und Gewicht. Erstelle eigene
            Trainingspläne und füge ganze Workouts mit einem Klick ein.
          </p>
        </section>

        <div className="mb-8">
          <StatsBar entries={entries} />
        </div>

        <div className="mb-8">
          <PlansSection onApply={addEntries} />
        </div>

        <div className="mb-8">
          <WorkoutForm onAdd={addEntry} />
        </div>

        <WorkoutTable
          entries={entries}
          onRemove={removeEntry}
          onUpdate={updateEntry}
        />

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          {user
            ? "Deine Trainings werden sicher in der Cloud gespeichert."
            : "Daten werden lokal gespeichert. Melde dich an, um sie überall zu nutzen."}
        </footer>
      </div>
    </div>
  );
};

export default Index;
