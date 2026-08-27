import { useEffect } from "react";
import { Toaster } from "sonner";
import { Arrangement } from "./arrangement";
import { DiceTray } from "./dice-tray";
import { ExportMenu, HowItWorks } from "./export-menu";
import { LibraryDialog } from "./library-dialog";
import { Mixer } from "./mixer";
import { SessionBar } from "./session-bar";
import { Transport } from "./transport";
import { engine } from "@/lib/music/engine";
import { useStudio } from "@/lib/store";

export function Studio() {
  const rehydrate = useStudio((s) => s.rehydrate);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    const arm = () => engine.unlock();
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(80%_60%_at_50%_0%,rgb(255_255_255/0.04),transparent)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pt-5 sm:px-6 sm:pt-8">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Studio table
            </p>
            <h1 className="font-display text-4xl leading-none font-medium tracking-tight italic sm:text-5xl">
              Song Dice
            </h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Four dice. Eight bars. A production-ready idea you can play, bounce, and drop in a DAW.
            </p>
          </div>
          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <HowItWorks />
            <LibraryDialog />
            <ExportMenu />
          </nav>
        </header>

        <main className="mt-6 flex flex-1 flex-col gap-4 pb-28 sm:mt-8 sm:gap-5">
          <SessionBar />
          <DiceTray />
          <Arrangement />
          <Mixer />
        </main>

        <Transport />
      </div>

      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#141416",
            color: "#f2f1ee",
            border: "1px solid rgba(242,241,238,0.12)",
          },
        }}
      />
    </div>
  );
}
