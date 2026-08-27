import { Die } from "./die";
import { useStudio } from "@/lib/store";
import { STEMS, type StemId } from "@/lib/music/theory";
import { bassFace, buildArrangement, chordFace, drumFace, melodyFace } from "@/lib/music/arrange";

function pack(stem: StemId, face: number) {
  switch (stem) {
    case "chords":
      return chordFace(face);
    case "bass":
      return bassFace(face);
    case "drums":
      return drumFace(face);
    case "melody":
      return melodyFace(face);
  }
}

export function DiceTray() {
  const faces = useStudio((s) => s.faces);
  const locked = useStudio((s) => s.locked);
  const tonic = useStudio((s) => s.tonic);
  const mode = useStudio((s) => s.mode);
  const roll = useStudio((s) => s.roll);
  const toggleLock = useStudio((s) => s.toggleLock);
  const arr = buildArrangement({ tonic, mode, faces });
  const chordHint = arr.chords.map((c) => c.roman).join("–");

  return (
    <div className="felt-well rounded-2xl px-3 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-4 sm:gap-x-6">
        {STEMS.map((stem) => {
          const meta = pack(stem, faces[stem]);
          return (
            <Die
              key={stem}
              stem={stem}
              face={faces[stem]}
              name={meta.name}
              hint={stem === "chords" ? chordHint : meta.hint}
              locked={locked[stem]}
              onRoll={() => roll([stem])}
              onToggleLock={() => toggleLock(stem)}
            />
          );
        })}
      </div>
    </div>
  );
}
