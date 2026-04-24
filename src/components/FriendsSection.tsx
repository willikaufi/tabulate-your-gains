import { useState } from "react";
import {
  Check,
  Mail,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
  Inbox,
  ClipboardList,
  Activity,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFriends } from "@/hooks/useFriends";
import { useShared } from "@/hooks/useShared";
import { useProfile } from "@/hooks/useProfile";
import { usePlans } from "@/hooks/usePlans";
import { toast } from "sonner";
import type {
  SharedItem,
  SharedPlanPayload,
  SharedSessionPayload,
} from "@/types/social";
import type { WorkoutEntry } from "@/types/workout";

interface Props {
  onAddSessionEntries: (
    entries: Omit<WorkoutEntry, "id" | "createdAt">[],
  ) => void;
}

export function FriendsSection({ onAddSessionEntries }: Props) {
  const { profile, updateProfile } = useProfile();
  const {
    accepted,
    incoming,
    outgoing,
    sendRequest,
    respondRequest,
    removeFriendship,
  } = useFriends();
  const { incoming: incomingItems, outgoing: outgoingItems, remove } =
    useShared();
  const { addPlan } = usePlans();

  const [usernameInput, setUsernameInput] = useState("");
  const [sending, setSending] = useState(false);
  const [previewItem, setPreviewItem] = useState<SharedItem | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await sendRequest(usernameInput);
    setSending(false);
    if (error) {
      toast.error("Anfrage fehlgeschlagen", { description: error });
      return;
    }
    toast.success("Anfrage gesendet");
    setUsernameInput("");
  };

  const startEditUsername = () => {
    setUsernameDraft(profile?.username ?? "");
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    const trimmed = usernameDraft.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
      toast.error("Ungültiger Benutzername", {
        description: "3–30 Zeichen, nur a–z, 0–9 und _",
      });
      return;
    }
    const { error } = await updateProfile({ username: trimmed });
    if (error) {
      toast.error("Konnte nicht ändern", { description: error });
      return;
    }
    toast.success("Benutzername aktualisiert");
    setEditingUsername(false);
  };

  const acceptItemAsCopy = async (item: SharedItem) => {
    if (item.kind === "plan") {
      const p = item.payload as SharedPlanPayload;
      await addPlan({
        name: `${p.name} (von @${item.sender?.username ?? "?"})`,
        description: p.description,
        exercises: p.exercises,
      });
      toast.success("Plan in deine Liste übernommen");
    } else {
      const s = item.payload as SharedSessionPayload;
      onAddSessionEntries(
        s.entries.map((e) => ({
          ...e,
          notes: e.notes
            ? `${e.notes} (geteilt von @${item.sender?.username ?? "?"})`
            : `Geteilt von @${item.sender?.username ?? "?"}`,
        })),
      );
      toast.success(`${s.entries.length} Einträge übernommen`);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Freunde</h2>
            <p className="text-xs text-muted-foreground">
              Tausche Pläne und Sessions mit deinem Trainings-Buddy
            </p>
          </div>
        </div>

        {profile && (
          <div className="flex items-center gap-2">
            {editingUsername ? (
              <>
                <Input
                  value={usernameDraft}
                  onChange={(e) => setUsernameDraft(e.target.value)}
                  className="h-8 w-40 text-xs"
                  placeholder="dein_name"
                />
                <Button size="sm" variant="hero" onClick={saveUsername}>
                  Speichern
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingUsername(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditUsername}
                className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-1.5 text-xs transition-smooth hover:border-primary/40"
                aria-label="Benutzernamen bearbeiten"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">@{profile.username}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        <form onSubmit={handleAdd} className="mb-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="benutzername"
              className="pl-7"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <Button
            type="submit"
            variant="hero"
            disabled={sending || !usernameInput.trim()}
          >
            <UserPlus className="h-4 w-4" />
            Anfrage senden
          </Button>
        </form>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Freunde
              {accepted.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px]">
                  {accepted.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Anfragen
              {incoming.length > 0 && (
                <Badge className="ml-2 h-4 bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {incoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shared">
              Geteilt
              {incomingItems.length > 0 && (
                <Badge className="ml-2 h-4 bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {incomingItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4">
            {accepted.length === 0 ? (
              <EmptyState
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                text="Noch keine Freunde. Sende oben eine Anfrage."
              />
            ) : (
              <ul className="space-y-2">
                {accepted.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        @{f.other.username}
                      </p>
                      {f.other.displayName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {f.other.displayName}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeFriendship(f.id);
                        toast.success("Freundschaft entfernt");
                      }}
                      className="hover:text-destructive"
                      aria-label="Freundschaft entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Eingang
              </h3>
              {incoming.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-5 w-5 text-muted-foreground" />}
                  text="Keine offenen Anfragen."
                />
              ) : (
                <ul className="space-y-2">
                  {incoming.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3"
                    >
                      <p className="font-medium">@{f.other.username}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="hero"
                          onClick={async () => {
                            const { error } = await respondRequest(f.id, true);
                            if (error)
                              toast.error("Fehler", { description: error });
                            else toast.success("Anfrage angenommen");
                          }}
                        >
                          <Check className="h-4 w-4" />
                          Annehmen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const { error } = await respondRequest(f.id, false);
                            if (error)
                              toast.error("Fehler", { description: error });
                            else toast.success("Anfrage abgelehnt");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gesendet
              </h3>
              {outgoing.length === 0 ? (
                <EmptyState
                  icon={<Send className="h-5 w-5 text-muted-foreground" />}
                  text="Keine offenen gesendeten Anfragen."
                />
              ) : (
                <ul className="space-y-2">
                  {outgoing.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3"
                    >
                      <div>
                        <p className="font-medium">@{f.other.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Wartet auf Antwort
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeFriendship(f.id);
                          toast.success("Anfrage zurückgezogen");
                        }}
                        aria-label="Anfrage zurückziehen"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shared" className="mt-4 space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Erhalten
              </h3>
              {incomingItems.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-5 w-5 text-muted-foreground" />}
                  text="Du hast noch nichts erhalten."
                />
              ) : (
                <ul className="space-y-2">
                  {incomingItems.map((it) => (
                    <SharedRow
                      key={it.id}
                      item={it}
                      onPreview={() => setPreviewItem(it)}
                      onAccept={() => acceptItemAsCopy(it)}
                      onDelete={() => {
                        remove(it.id);
                        toast.success("Entfernt");
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gesendet
              </h3>
              {outgoingItems.length === 0 ? (
                <EmptyState
                  icon={<Send className="h-5 w-5 text-muted-foreground" />}
                  text="Du hast noch nichts geteilt."
                />
              ) : (
                <ul className="space-y-2">
                  {outgoingItems.map((it) => (
                    <SharedRow
                      key={it.id}
                      item={it}
                      onPreview={() => setPreviewItem(it)}
                      onDelete={() => {
                        remove(it.id);
                        toast.success("Entfernt");
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PreviewDialog
        item={previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        onAccept={(it) => {
          acceptItemAsCopy(it);
          setPreviewItem(null);
        }}
      />
    </div>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
      <div className="rounded-full bg-secondary p-3">{icon}</div>
      <p className="px-4 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SharedRow({
  item,
  onPreview,
  onAccept,
  onDelete,
}: {
  item: SharedItem;
  onPreview: () => void;
  onAccept?: () => void;
  onDelete: () => void;
}) {
  const Icon = item.kind === "plan" ? ClipboardList : Activity;
  const otherUser = item.outgoing ? item.recipient : item.sender;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.kind === "plan" ? "Plan" : "Session"} ·{" "}
            {item.outgoing ? "an" : "von"} @{otherUser?.username ?? "?"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onPreview}
          aria-label="Ansehen"
          className="hover:text-primary"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {onAccept && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onAccept}
            aria-label="Übernehmen"
            className="hover:text-primary"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          aria-label="Löschen"
          className="hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function PreviewDialog({
  item,
  onOpenChange,
  onAccept,
}: {
  item: SharedItem | null;
  onOpenChange: (open: boolean) => void;
  onAccept: (item: SharedItem) => void;
}) {
  if (!item) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }
  const isPlan = item.kind === "plan";
  const exercises = isPlan
    ? (item.payload as SharedPlanPayload).exercises
    : (item.payload as SharedSessionPayload).entries;
  const otherUser = item.outgoing ? item.recipient : item.sender;

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            {isPlan ? "Trainingsplan" : "Trainings-Session"} ·{" "}
            {item.outgoing ? "an" : "von"} @{otherUser?.username ?? "?"}
          </DialogDescription>
        </DialogHeader>

        {item.note && (
          <p className="rounded-lg bg-secondary/50 p-3 text-sm italic text-muted-foreground">
            „{item.note}"
          </p>
        )}

        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Übung</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead className="text-right">Sätze</TableHead>
                <TableHead className="text-right">Wdh.</TableHead>
                <TableHead className="text-right">Gewicht</TableHead>
                <TableHead className="text-right">Pause</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercises.map((ex, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{ex.exercise}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ex.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {ex.sets}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {ex.reps}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {ex.weight} kg
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {("restMin" in ex ? ex.restMin : 0) ?? 0} min
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          {!item.outgoing && (
            <Button variant="hero" onClick={() => onAccept(item)}>
              <Plus className="h-4 w-4" />
              In meine Liste übernehmen
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
