import { useState } from "react";
import { Check, Copy, FileAudio, Piano } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { arrangementText, bounceWav, buildMidi, downloadBlob, fileBase } from "@/lib/music/export";
import { sessionOf, useStudio } from "@/lib/store";

export function ExportMenu() {
  const [busy, setBusy] = useState(false);
  const state = useStudio();

  const session = sessionOf(state);
  const base = fileBase(session, state.bpm);

  async function onMidi() {
    const bytes = buildMidi(session, state.bpm, state.swing);
    downloadBlob(`${base}.mid`, new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" }));
    toast("MIDI downloaded");
  }

  async function onWav() {
    setBusy(true);
    try {
      const wav = await bounceWav(session, state.bpm, state.swing, state.mixer);
      downloadBlob(`${base}.wav`, new Blob([wav], { type: "audio/wav" }));
      toast("WAV bounce ready");
    } catch {
      toast("Could not bounce audio");
    } finally {
      setBusy(false);
    }
  }

  async function onCopy() {
    const text = arrangementText(session, state.bpm, state.swing);
    try {
      await navigator.clipboard.writeText(text);
      toast("Chart copied");
    } catch {
      toast("Could not copy");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={busy}>
          {busy ? "Bouncing…" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void onMidi()}>
          <Piano />
          Download MIDI
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onWav()}>
          <FileAudio />
          Bounce WAV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void onCopy()}>
          <Copy />
          Copy chart
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
        Guide
      </Button>
      {open ? (
        <GuideDialog onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function GuideDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-background/80"
        aria-label="Close guide"
        onClick={onClose}
      />
      <div className="relative z-10 m-4 max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl font-medium tracking-tight">How it casts</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Four dice.</span> Chords, bass, drums, melody — six faces each, written as 8-bar parts.
          </li>
          <li>
            <span className="font-medium text-foreground">Lock what you like.</span> Roll the rest. Tap a die to recast just that stem.
          </li>
          <li>
            <span className="font-medium text-foreground">Play the loop.</span> Sidechained pad, analog drums, bass, lead. Mute and solo in the mixer.
          </li>
          <li>
            <span className="font-medium text-foreground">Take it to the DAW.</span> MIDI for editing, WAV for a printed bounce, chart for the session notes.
          </li>
        </ul>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">Space plays. R rolls the table.</p>
        <Button className="mt-5 w-full" onClick={onClose}>
          <Check />
          Got it
        </Button>
      </div>
    </div>
  );
}
