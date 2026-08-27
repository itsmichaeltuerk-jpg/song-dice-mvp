import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { STEM_LABEL, type StemId } from "@/lib/music/theory";

const PIPS: number[][] = [
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
];

const FACE_ROT = [
  { x: 0, y: 0 },
  { x: -90, y: 0 },
  { x: 0, y: -90 },
  { x: 0, y: 90 },
  { x: 90, y: 0 },
  { x: 0, y: 180 },
];

function Face({ n }: { n: number }) {
  const pips = PIPS[n]!;
  return (
    <div className={`die-face die-face-${n + 1}`} aria-hidden="true">
      <div className="die-pips">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={cn("die-pip", !pips.includes(i) && "opacity-0")} />
        ))}
      </div>
    </div>
  );
}

export function Die({
  stem,
  face,
  name,
  hint,
  locked,
  onRoll,
  onToggleLock,
}: {
  stem: StemId;
  face: number;
  name: string;
  hint: string;
  locked: boolean;
  onRoll: () => void;
  onToggleLock: () => void;
}) {
  const [rot, setRot] = useState(FACE_ROT[face]!);
  const [instant, setInstant] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const prev = useRef(face);
  const spinTimer = useRef<number | null>(null);

  useEffect(() => {
    if (prev.current === face) return;
    prev.current = face;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const land = FACE_ROT[face]!;
    if (reduce) {
      setInstant(true);
      setRot(land);
      return;
    }
    const extraX = 360 * (2 + (face % 2));
    const extraY = 360 * (2 + ((face + 1) % 3));
    setInstant(false);
    setSpinning(true);
    setRot({ x: land.x + extraX, y: land.y + extraY });
    if (spinTimer.current) window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => {
      setInstant(true);
      setRot(land);
      setSpinning(false);
    }, 920);
  }, [face]);

  useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearTimeout(spinTimer.current);
    };
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 transition-opacity duration-200",
        locked && "opacity-70",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-pressed={locked}
        aria-label={locked ? `Unlock ${STEM_LABEL[stem]}` : `Lock ${STEM_LABEL[stem]}`}
        onClick={onToggleLock}
        className={cn("text-muted-foreground", locked && "text-foreground")}
      >
        {locked ? <Lock /> : <Unlock />}
      </Button>
      <button
        type="button"
        className="die-scene touch-manipulation"
        style={{ "--die-size": "4.5rem" } as CSSProperties}
        onClick={() => {
          if (!locked && !spinning) onRoll();
        }}
        aria-label={`Roll ${STEM_LABEL[stem]}, currently ${name}`}
        disabled={locked || spinning}
      >
        <div
          className={cn("die-cube", instant && "is-instant")}
          style={
            {
              "--rx": `${rot.x}deg`,
              "--ry": `${rot.y}deg`,
              "--rz": "0deg",
            } as CSSProperties
          }
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Face key={i} n={i} />
          ))}
        </div>
      </button>
      <div className="text-center">
        <div className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {STEM_LABEL[stem]}
        </div>
        <div className="mt-1 font-display text-lg leading-tight font-medium tracking-tight text-foreground">
          {name}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">{hint}</div>
      </div>
    </div>
  );
}
