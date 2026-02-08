"use client";

import { useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useConfiguratorStore,
  CATEGORIES,
  OPTIONS,
  type Category,
  type ConfigOption,
} from "@/store/useConfiguratorStore";

/* ——————————————————————————————————————————————
   Category Tabs (Horizontal Pill Selector)
   —————————————————————————————————————————————— */

function CategoryTabs() {
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);
  const setActiveCategory = useConfiguratorStore((s) => s.setActiveCategory);

  return (
    <div className="flex items-center gap-1 px-2">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <motion.button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="relative flex-1 px-3 py-2.5 rounded-xl text-center"
            whileTap={{ scale: 0.97 }}
          >
            {/* Active pill background */}
            {isActive && (
              <motion.div
                layoutId="activeCategoryPill"
                className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.06]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex flex-col items-center gap-0.5">
              <span
                className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/35"
                }`}
              >
                {cat.label}
              </span>
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  isActive ? "text-white/50" : "text-white/20"
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
   Color Swatch (Individual item)
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
      initial={{ opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 350,
        damping: 25,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Swatch circle */}
      <div className="relative">
        <motion.div
          className="w-[52px] h-[52px] rounded-full"
          style={{
            background: option.color,
            boxShadow: isSelected
              ? `0 0 20px ${option.color}50, 0 4px 15px ${option.color}30`
              : `0 2px 8px rgba(0,0,0,0.3)`,
          }}
          animate={{
            scale: isSelected ? 1 : 0.88,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />

        {/* Selection ring */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="absolute -inset-[5px] rounded-full border-[2px] border-white/70"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <span
        className={`text-[11px] font-medium whitespace-nowrap transition-colors duration-200 ${
          isSelected ? "text-white/90" : "text-white/30"
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
      // Mobile haptic feedback
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
    <div className="flex flex-col gap-3">
      {/* Swatches Row */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto px-6 py-3 scrollbar-hide snap-x"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
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
              <p className="text-xs text-white/35 mt-0.5">
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
   Summary Footer
   —————————————————————————————————————————————— */

function SummaryFooter() {
  const bodyColor = useConfiguratorStore((s) => s.bodyColor);
  const keycapColor = useConfiguratorStore((s) => s.keycapColor);
  const switchColor = useConfiguratorStore((s) => s.switchColor);
  const selectedOptions = useConfiguratorStore((s) => s.selectedOptions);

  const bodyName =
    OPTIONS.body.find((o) => o.id === selectedOptions.body)?.name ?? "";
  const keycapName =
    OPTIONS.keycaps.find((o) => o.id === selectedOptions.keycaps)?.name ?? "";
  const switchName =
    OPTIONS.switches.find((o) => o.id === selectedOptions.switches)?.name ?? "";

  return (
    <div className="flex items-center justify-between px-4 pt-3 mt-1 border-t border-white/[0.04]">
      {/* Config preview */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {[bodyColor, keycapColor, switchColor].map((c, i) => (
            <motion.div
              key={i}
              className="w-5 h-5 rounded-full border-2 border-zinc-900"
              style={{ background: c }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08 }}
            />
          ))}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-white/25 leading-tight">
            {bodyName} · {keycapName}
          </span>
          <span className="text-[10px] text-white/25 leading-tight">
            {switchName}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <motion.button
        className="px-5 py-2 text-xs font-semibold text-white/90 bg-white/[0.07] hover:bg-white/[0.12] rounded-full transition-colors border border-white/[0.06]"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Kaydet
      </motion.button>
    </div>
  );
}

/* ——————————————————————————————————————————————
   Main Configurator UI (Overlay)
   —————————————————————————————————————————————— */

export default function ConfiguratorUI() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      {/* Glass Panel */}
      <motion.div
        className="mx-3 mb-3 rounded-3xl glass pointer-events-auto py-4 pb-5"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          delay: 0.3,
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

