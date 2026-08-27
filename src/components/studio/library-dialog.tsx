import { BookmarkPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bassFace, chordFace, drumFace, melodyFace } from "@/lib/music/arrange";
import { keyLabel } from "@/lib/music/theory";
import { useStudio } from "@/lib/store";

export function LibraryDialog() {
  const library = useStudio((s) => s.library);
  const saveRoll = useStudio((s) => s.saveRoll);
  const loadRoll = useStudio((s) => s.loadRoll);
  const deleteRoll = useStudio((s) => s.deleteRoll);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Library
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Library</DialogTitle>
          <DialogDescription>Saved 8-bar casts. Load one to restore the table.</DialogDescription>
        </DialogHeader>
        <Button
          variant="secondary"
          onClick={() => {
            saveRoll();
            toast("Saved this cast");
          }}
        >
          <BookmarkPlus />
          Save current cast
        </Button>
        {library.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing saved yet. Roll something you like, then keep it here.
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {library.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    loadRoll(item.id);
                    toast(`Loaded ${item.name}`);
                  }}
                >
                  <div className="truncate text-sm font-medium">{item.name}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {keyLabel(item.tonic, item.mode)} · {chordFace(item.faces.chords).name} ·{" "}
                    {bassFace(item.faces.bass).name} · {drumFace(item.faces.drums).name} ·{" "}
                    {melodyFace(item.faces.melody).name}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => deleteRoll(item.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
