"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function JarvisHudToggle() {
  const [isHudActive, setIsHudActive] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsHudActive(!isHudActive)}
        className="fixed top-6 right-6 z-50 px-4 py-2 bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 rounded-md font-mono text-xs tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-900/80 transition-all"
      >
        [ {isHudActive ? "DISABLE HUD" : "INIT JARVIS HUD"} ]
      </button>

      <AnimatePresence>
        {isHudActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-40 pointer-events-none border-[16px] border-cyan-500/10 bg-cyan-950/20 backdrop-blur-[2px] overflow-hidden"
          >
            {/* Esquinas de mira táctica */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-400" />

            {/* Líneas de escaneo animadas */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse pointer-events-none" />
            
            <div className="absolute bottom-8 left-8 font-mono text-xs text-cyan-400/80">
              STATUS: ONLINE // SECURITY_LEVEL: ALPHA // SYSTEM: NOMINAL
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}