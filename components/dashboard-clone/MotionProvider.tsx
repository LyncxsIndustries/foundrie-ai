"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { gsap } from "gsap";

interface MotionContextType {
  motionEnabled: boolean;
  toggleMotion: () => void;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [motionEnabled, setMotionEnabled] = useState(true);

  // When motion is toggled, update GSAP global timeScale
  // timeScale(1) means normal speed, timeScale(0) means paused/skipped (technically 0 means paused, 
  // but we can set duration to 0 or use gsap.globalTimeline.timeScale(999) to make it instant,
  // or simply conditionally run animations in our components).
  // Alternatively, just pass the boolean down and let components handle it, or use GSAP's matchMedia.
  
  const toggleMotion = () => {
    setMotionEnabled((prev) => {
      const next = !prev;
      // If disabling motion, force all animations to complete instantly (timeScale 999)
      // or pause them. The best way is to not run them or use matchMedia.
      // We will export the boolean so components can conditionally run animations.
      gsap.globalTimeline.timeScale(next ? 1 : 999);
      return next;
    });
  };

  useEffect(() => {
    // Respect OS reduced motion preference on mount
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setMotionEnabled(false);
      gsap.globalTimeline.timeScale(999);
    }
  }, []);

  return (
    <MotionContext.Provider value={{ motionEnabled, toggleMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error("useMotion must be used within a MotionProvider");
  }
  return context;
}
