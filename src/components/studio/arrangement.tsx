import { useEffect, useMemo, useState } from "react";
import { buildArrangement } from "@/lib/music/arrange";
import { engine } from "@/lib/music/engine";
import { BARS, STEPS_PER_BAR, STEM_LABEL, TOTAL_STEPS, type StemId } from "@/lib/music/theory";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";

const ROWS: StemId[] = ["chords", "bass", "drums", "melody"];

export function Arrangement() {
  const tonic = useStudio((s) => s.tonic);
  const mode = useStudio((s) => s.mode);
  const faces = useStudio((s) => s.faces);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return engine.subscribe((s, p) => {
      setStep(s);
      setPlaying(p);
    });
  }, []);

  const arr = useMemo(
    () => buildArrangement({ tonic, mode, faces }),
    [tonic, mode, faces],
  );

  const ticks = useMemo(() => {
    const map: Record<StemId, boolean[]> = {
      chords: Array.from({ length: TOTAL_STEPS }, () => false),
      bass: Array.from({ length: TOTAL_STEPS }, () => false),
      drums: Array.from({ length: TOTAL_STEPS }, () => false),
      melody: Array.from({ length: TOTAL_STEPS }, () => false),
    };
    for (const c of arr.chords) {
      for (let i = 0; i < c.dur; i += 4) map.chords[c.step + i] = true;
    }
    for (const n of arr.bass) map.bass[n.step] = true;
    for (const n of arr.melody) map.melody[n.step] = true;
    for (const d of arr.drums) map.drums[d.step] = true;
    return map;
  }, [arr]);

  const playPct = playing ? (step / TOTAL_STEPS) * 100 : (step / TOTAL_STEPS) * 100;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Eight bars
          </h2>
          <p className="mt-1 font-display text-xl leading-tight font-medium tracking-tight">
            {arr.chordChart.filter((_, i) => i % 2 === 0).join(" · ")}
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {String(Math.floor(step / STEPS_PER_BAR) + 1).padStart(2, "0")} / 08
        </span>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-felt p-2">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `3.5rem repeat(${BARS}, minmax(0, 1fr))` }}
        >
          <div />
          {Array.from({ length: BARS }, (_, bar) => (
            <div
              key={bar}
              className="pb-1 text-center font-mono text-[10px] text-muted-foreground tabular-nums"
            >
              {arr.chordChart[bar]}
            </div>
          ))}
          {ROWS.map((stem) => (
            <StemRow key={stem} stem={stem} ticks={ticks[stem]!} />
          ))}
        </div>
        <div
          className="playhead pointer-events-none absolute top-7 bottom-2 w-px"
          style={{
            left: `calc(3.5rem + (100% - 3.5rem - 1rem) * ${playPct / 100} + 0.5rem)`,
            opacity: playing ? 1 : 0.35,
          }}
        />
      </div>
    </section>
  );
}

function StemRow({ stem, ticks }: { stem: StemId; ticks: boolean[] }) {
  return (
    <>
      <div className="flex items-center pr-2 text-[11px] tracking-wide text-muted-foreground">
        {STEM_LABEL[stem]}
      </div>
      {Array.from({ length: BARS }, (_, bar) => (
        <div key={bar} className="grid grid-cols-8 gap-px py-1">
          {Array.from({ length: 8 }, (_, i) => {
            const step = bar * STEPS_PER_BAR + i * 2;
            const on = ticks[step] || ticks[step + 1];
            const accent = i === 0;
            return (
              <span
                key={i}
                className={cn("seq-cell h-3 rounded-[2px] sm:h-3.5", on && "is-on", on && accent && "is-accent")}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}
