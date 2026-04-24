import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Users } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useShared } from "@/hooks/useShared";
import { toast } from "sonner";
import type {
  SharedItemKind,
  SharedPlanPayload,
  SharedSessionPayload,
} from "@/types/social";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: SharedItemKind;
  title: string;
  payload: SharedPlanPayload | SharedSessionPayload | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  kind,
  title,
  payload,
}: Props) {
  const { accepted } = useFriends();
  const { share } = useShared();
  const [recipientId, setRecipientId] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!recipientId || !payload) return;
    setSubmitting(true);
    const { error } = await share({
      recipientId,
      kind,
      title,
      note: note.trim() || undefined,
      payload,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Konnte nicht geteilt werden", { description: error });
      return;
    }
    toast.success("Geteilt");
    setRecipientId("");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {kind === "plan" ? "Plan teilen" : "Session teilen"}
          </DialogTitle>
          <DialogDescription>
            Sende „{title}" an einen Freund. Er kann ansehen oder in seine
            eigene Liste übernehmen.
          </DialogDescription>
        </DialogHeader>

        {accepted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="rounded-full bg-secondary p-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Du hast noch keine Freunde. Füge zuerst jemanden über die
              Freundesliste hinzu.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-recipient">Freund</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger id="share-recipient">
                  <SelectValue placeholder="Freund auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accepted.map((f) => (
                    <SelectItem key={f.id} value={f.other.id}>
                      @{f.other.username}
                      {f.other.displayName ? ` · ${f.other.displayName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-note">Notiz (optional)</Label>
              <Textarea
                id="share-note"
                placeholder="Probier das mal aus…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={!recipientId || submitting || accepted.length === 0}
          >
            <Send className="h-4 w-4" />
            Senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
