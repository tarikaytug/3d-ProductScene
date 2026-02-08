"use client";

import dynamic from "next/dynamic";
import ConfiguratorUI from "@/components/ConfiguratorUI";

/* ——— 3D Scene – client-only (no SSR for WebGL) ——— */
const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
        <p className="text-sm text-white/30 animate-pulse tracking-wide">
          Loading 3D Experience…
        </p>
      </div>
    </div>
  ),
});

/* ——— Page ——— */
export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-zinc-950">
      {/* ——— Header ——— */}
      <header className="absolute top-0 left-0 right-0 z-10 p-5">
        <h1 className="text-lg font-bold tracking-tight text-white/90">
          MECH
          <span className="text-white/40 font-normal">CONFIG</span>
        </h1>
        <p className="text-[11px] text-white/25 mt-0.5 tracking-wide">
          Premium Keyboard Configurator
        </p>
      </header>

      {/* ——— 3D Scene (full viewport) ——— */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* ——— Configurator UI Overlay ——— */}
      <ConfiguratorUI />
    </main>
  );
}
