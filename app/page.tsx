"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import ConfiguratorUI from "@/components/ConfiguratorUI";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

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
  const soundEnabled = useConfiguratorStore((s) => s.soundEnabled);
  const toggleSound = useConfiguratorStore((s) => s.toggleSound);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-zinc-950">
      {/* ——— Animated Header ——— */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-white/90 font-display">
            MECH
            <span className="text-white/40 font-light">CONFIG</span>
          </h1>
          <p className="text-[11px] text-white/25 mt-0.5 tracking-wide">
            Premium Keyboard Configurator
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <motion.button
            onClick={toggleSound}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.1] transition-colors"
            whileTap={{ scale: 0.9 }}
            title={soundEnabled ? "Sesi kapat" : "Sesi aç"}
          >
            {soundEnabled ? (
              <Volume2 size={14} className="text-white/50" />
            ) : (
              <VolumeX size={14} className="text-white/25" />
            )}
          </motion.button>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/40 font-medium tracking-wide">
              Interactive
            </span>
          </div>
        </div>
      </motion.header>

      {/* ——— Hint ——— */}
      <motion.div
        className="absolute top-20 left-0 right-0 z-10 text-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <p className="text-[11px] text-white/20 tracking-widest uppercase font-display">
          Klavyeni kullanarak tuşlara bas ⌨
        </p>
      </motion.div>

      {/* ——— 3D Scene ——— */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* ——— Vignette Overlay ——— */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* ——— Configurator UI Overlay ——— */}
      <ConfiguratorUI />
    </main>
  );
}
