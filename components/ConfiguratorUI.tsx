"use client";

import { useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Keyboard, Cog } from "lucide-react";
import {
  useConfiguratorStore,
  CATEGORIES,
  OPTIONS,
  type ConfigOption,
} from "@/store/useConfiguratorStore";

/* ——————————————————————————————————————————————
   Icon mapping
   —————————————————————————————————————————————— */

const CATEGORY_ICONS = {
  body: Palette,
  keycaps: Keyboard,
  switches: Cog,
} as const;

/* ——————————————————————————————————————————————
   Category Tabs
   —————————————————————————————————————————————— */

function CategoryTabs() {
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);
  const setActiveCategory = useConfiguratorStore((s) => s.setActiveCategory);

  return (
    <div className="flex items-center gap-1 px-3">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const Icon = CATEGORY_ICONS[cat.id];
        return (
          <motion.button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="relative flex-1 px-3 py-2.5 rounded-xl text-center"
            whileTap={{ scale: 0.96 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategoryPill"
                className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.06]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex flex-col items-center gap-1">
              <Icon
                size={14}
                className={`transition-colors duration-300 ${
                  isActive ? "text-white/80" : "text-white/25"
                }`}
              />
              <span
                className={`text-[11px] font-semibold tracking-wide transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/30"
                }`}
              >
                {cat.label}
              </span>
              <span
                className={`text-[9px] transition-colors duration-300 ${
                  isActive ? "text-white/40" : "text-white/15"
                }`}
              >
                {cat.subtitle}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ——————————————————————————————————————————————
   Color Swatch
   —————————————————————————————————————————————— */

interface SwatchProps {
  option: ConfigOption;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
}

function ColorSwatch({ option, isSelected, index, onSelect }: SwatchProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="snap-center flex-shrink-0 flex flex-col items-center gap-2 outline-none"
      initial={{ opacity: 0, scale: 0.7, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.045,
        type: "spring",
        stiffness: 350,
        damping: 25,
      }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
    >
      <div className="relative">
        <motion.div
          className="w-[52px] h-[52px] rounded-full"
          style={{
            background: option.color,
            boxShadow: isSelected
              ? `0 0 0 3px #09090b, 0 0 24px ${option.color}55, 0 6px 20px ${option.color}35`
              : "0 2px 10px rgba(0,0,0,0.4)",
          }}
          animate={{ scale: isSelected ? 1 : 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />

        {/* Selection ring */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="absolute -inset-[5px] rounded-full border-[2px] border-white/70"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </AnimatePresence>

        {/* Inner shine */}
        <div
          className="absolute inset-[6px] rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)",
          }}
        />
      </div>

      <span
        className={`text-[10px] font-medium whitespace-nowrap transition-colors duration-200 ${
          isSelected ? "text-white/90" : "text-white/25"
        }`}
      >
        {option.name}
      </span>
    </motion.button>
  );
}

/* ——————————————————————————————————————————————
   Color Carousel
   —————————————————————————————————————————————— */

function ColorCarousel() {
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);
  const selectedOptions = useConfiguratorStore((s) => s.selectedOptions);
  const selectOption = useConfiguratorStore((s) => s.selectOption);
  const scrollRef = useRef<HTMLDivElement>(null);

  const options = OPTIONS[activeCategory];
  const selectedId = selectedOptions[activeCategory];
  const selectedOption = options.find((o) => o.id === selectedId);

  const handleSelect = useCallback(
    (option: ConfigOption) => {
      selectOption(activeCategory, option.id);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(8);
      }
    },
    [activeCategory, selectOption]
  );

  // Auto-scroll to selected item on category change
  useEffect(() => {
    if (!scrollRef.current) return;
    const idx = options.findIndex((o) => o.id === selectedId);
    const el = scrollRef.current.children[idx] as HTMLElement | undefined;
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory, selectedId, options]);

  return (
    <div className="flex flex-col gap-2">
      {/* Carousel with edge fades */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/50 to-transparent pointer-events-none z-10 rounded-l-2xl" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/50 to-transparent pointer-events-none z-10 rounded-r-2xl" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto px-8 py-3 scrollbar-hide snap-x"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {options.map((opt, i) => (
              <ColorSwatch
                key={opt.id}
                option={opt}
                isSelected={opt.id === selectedId}
                index={i}
                onSelect={() => handleSelect(opt)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Selected Info */}
      <AnimatePresence mode="wait">
        {selectedOption && (
          <motion.div
            key={selectedOption.id}
            className="text-center px-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm font-semibold text-white/80">
              {selectedOption.name}
            </p>
            {selectedOption.description && (
              <p className="text-[11px] text-white/35 mt-0.5">
                {selectedOption.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Summary Footer (with dynamic pricing)
   —————————————————————————————————————————————— */

const PREMIUM_BODIES = new Set(["burgundy", "forest", "rose"]);
const PREMIUM_KEYCAPS = new Set(["matcha", "lavender", "sunset"]);
const PREMIUM_SWITCHES = new Set(["speed", "black"]);

function SummaryFooter() {
  const bodyColor = useConfiguratorStore((s) => s.bodyColor);
  const keycapColor = useConfiguratorStore((s) => s.keycapColor);
  const switchColor = useConfiguratorStore((s) => s.switchColor);
  const selectedOptions = useConfiguratorStore((s) => s.selectedOptions);

  const bodyOpt = OPTIONS.body.find((o) => o.id === selectedOptions.body);
  const keycapOpt = OPTIONS.keycaps.find(
    (o) => o.id === selectedOptions.keycaps
  );
  const switchOpt = OPTIONS.switches.find(
    (o) => o.id === selectedOptions.switches
  );

  const price = useMemo(() => {
    let total = 349;
    if (PREMIUM_BODIES.has(selectedOptions.body)) total += 30;
    if (PREMIUM_KEYCAPS.has(selectedOptions.keycaps)) total += 25;
    if (PREMIUM_SWITCHES.has(selectedOptions.switches)) total += 15;
    return total;
  }, [selectedOptions]);

  return (
    <div className="flex items-center justify-between px-4 pt-3 mt-2 border-t border-white/[0.05]">
      {/* Config preview */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {[bodyColor, keycapColor, switchColor].map((c, i) => (
            <motion.div
              key={`${c}-${i}`}
              className="w-5 h-5 rounded-full border-2 border-zinc-900"
              style={{ background: c }}
              animate={{ scale: [0.8, 1] }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-white/30 leading-tight">
            {bodyOpt?.name} · {keycapOpt?.name}
          </span>
          <span className="text-[10px] text-white/20 leading-tight">
            {switchOpt?.name}
          </span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={price}
            className="text-base font-bold text-white/90 tabular-nums"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            ${price}
          </motion.span>
        </AnimatePresence>

        <motion.button
          className="px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-white/90 rounded-full transition-colors"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          Sipariş Ver
        </motion.button>
      </div>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Main Configurator UI (Bottom Overlay)
   —————————————————————————————————————————————— */

export default function ConfiguratorUI() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      <motion.div
        className="mx-3 mb-3 rounded-3xl glass pointer-events-auto py-4 pb-5"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 22,
          delay: 0.4,
        }}
      >
        <CategoryTabs />

        <div className="mt-3">
          <ColorCarousel />
        </div>

        <SummaryFooter />
      </motion.div>
    </div>
  );
}
