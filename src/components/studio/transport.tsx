import { useEffect, useState } from "react";
import { Dices, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bindVisibility, engine } from "@/lib/music/engine";
import { STEMS } from "@/lib/music/theory";
import { useStudio } from "@/lib/store";

export function Transport() {
  const roll = useStudio((s) => s.roll);
  const locked = useStudio((s) => s.locked);
  const bpm = useStudio((s) => s.bpm);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const unsub = engine.subscribe((_s, p) => setPlaying(p));
    const unbind = bindVisibility();
    return () => {
      unsub();
      unbind();
    };
  }, []);

  function onPlay() {
    engine.unlock();
    engine.toggle();
  }

  function onRoll() {
    engine.unlock();
    const targets = STEMS.filter((s) => !locked[s]);
    targets.forEach((stem, i) => {
      window.setTimeout(() => roll([stem]), i * 90);
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        engine.unlock();
        engine.toggle();
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const { locked, roll } = useStudio.getState();
        engine.unlock();
        const targets = STEMS.filter((s) => !locked[s]);
        targets.forEach((stem, i) => {
          window.setTimeout(() => roll([stem]), i * 90);
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-card/95 p-2 shadow-[var(--shadow-border)] backdrop-blur-sm">
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-12 flex-1"
          onPointerDown={() => engine.unlock()}
          onClick={onPlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 flex-1"
          onPointerDown={() => engine.unlock()}
          onClick={onRoll}
        >
          <Dices className="size-5" />
          Roll
        </Button>
        <span className="hidden w-14 pr-2 text-right font-mono text-xs text-muted-foreground tabular-nums sm:block">
          {bpm}
        </span>
      </div>
    </div>
  );
}
