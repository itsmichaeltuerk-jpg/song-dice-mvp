import type { ReactNode } from "react";
import { NOTE_NAMES, type Mode } from "@/lib/music/theory";
import { useStudio } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SessionBar() {
  const tonic = useStudio((s) => s.tonic);
  const mode = useStudio((s) => s.mode);
  const bpm = useStudio((s) => s.bpm);
  const swing = useStudio((s) => s.swing);
  const setTonic = useStudio((s) => s.setTonic);
  const setMode = useStudio((s) => s.setMode);
  const setBpm = useStudio((s) => s.setBpm);
  const setSwing = useStudio((s) => s.setSwing);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      <Field label="Key">
        <Select value={String(tonic)} onValueChange={(v) => setTonic(Number(v))}>
          <SelectTrigger size="sm" className="min-w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_NAMES.map((n, i) => (
              <SelectItem key={n} value={String(i)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Mode">
        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger size="sm" className="min-w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="major">Major</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label={`Tempo  ${bpm}`} className="flex-1">
        <Slider min={60} max={160} step={1} value={[bpm]} onValueChange={(v) => setBpm(v[0] ?? 96)} />
      </Field>
      <Field label={swing > 0.02 ? `Swing  ${Math.round(swing * 100)}` : "Straight"} className="flex-1">
        <Slider min={0} max={0.7} step={0.01} value={[swing]} onValueChange={(v) => setSwing(v[0] ?? 0)} />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className ?? ""}`}>
      <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
