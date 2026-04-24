import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

const credSchema = z.object({
  email: z.string().trim().min(1).email("Ungültige E-Mail-Adresse").max(255),
  password: z.string().min(6, "Mindestens 6 Zeichen").max(72),
}).required();

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error("Anmeldung fehlgeschlagen", { description: error.message });
      return;
    }
    toast.success("Willkommen zurück!");
    navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      toast.error("Registrierung fehlgeschlagen", { description: error.message });
      return;
    }
    toast.success("Konto erstellt – du bist angemeldet!");
    navigate("/", { replace: true });
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/`,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google-Login fehlgeschlagen", {
        description: result.error.message,
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-glow" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Fit<span className="text-gradient">Track</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-surface p-6 shadow-card">
          <h2 className="mb-1 font-display text-xl font-semibold">
            Willkommen
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Melde dich an, um deinen Fortschritt überall zu speichern.
          </p>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <EmailPasswordFields
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                />
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? "Bitte warten…" : "Anmelden"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <EmailPasswordFields
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                />
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? "Bitte warten…" : "Konto erstellen"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">oder</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            <GoogleIcon /> Mit Google fortfahren
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ohne Anmeldung speichert FitTrack lokal in deinem Browser.
        </p>
      </div>
    </div>
  );
};

function EmailPasswordFields({
  email,
  setEmail,
  password,
  setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="du@beispiel.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
            required
            minLength={6}
          />
        </div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  );
}

export default Auth;
