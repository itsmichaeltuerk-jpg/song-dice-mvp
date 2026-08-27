import { Slider } from "@/components/ui/slider";
import { STEM_LABEL, STEMS, type StemId } from "@/lib/music/theory";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Mixer() {
  const mixer = useStudio((s) => s.mixer);
  const setVolume = useStudio((s) => s.setVolume);
  const toggleMute = useStudio((s) => s.toggleMute);
  const toggleSolo = useStudio((s) => s.toggleSolo);

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <h2 className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        Mixer
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STEMS.map((stem) => (
          <Strip
            key={stem}
            stem={stem}
            volume={mixer.volumes[stem]}
            muted={mixer.muted[stem]}
            solo={mixer.solo === stem}
            onVolume={(v) => setVolume(stem, v)}
            onMute={() => toggleMute(stem)}
            onSolo={() => toggleSolo(stem)}
          />
        ))}
      </div>
    </section>
  );
}

function Strip({
  stem,
  volume,
  muted,
  solo,
  onVolume,
  onMute,
  onSolo,
}: {
  stem: StemId;
  volume: number;
  muted: boolean;
  solo: boolean;
  onVolume: (v: number) => void;
  onMute: () => void;
  onSolo: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{STEM_LABEL[stem]}</span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {Math.round(volume * 100)}
        </span>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[volume]}
        onValueChange={(v) => onVolume(v[0] ?? 0)}
        aria-label={`${STEM_LABEL[stem]} volume`}
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onMute}
          className={cn(
            "h-8 flex-1 rounded-md text-[11px] font-medium tracking-wide shadow-[var(--shadow-border)] transition-colors",
            muted ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          M
        </button>
        <button
          type="button"
          onClick={onSolo}
          className={cn(
            "h-8 flex-1 rounded-md text-[11px] font-medium tracking-wide shadow-[var(--shadow-border)] transition-colors",
            solo ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          S
        </button>
      </div>
    </div>
  );
}
