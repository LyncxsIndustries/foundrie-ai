"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", {
        opacity: 0,
        y: 50,
        duration: 1.2,
        ease: "power3.out",
        force3D: true,
      });

      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.2,
        ease: "power3.out",
        force3D: true,
      });

      gsap.from(".hero-cta", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.4,
        ease: "power3.out",
        force3D: true,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="container mx-auto px-4 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="hero-title text-5xl font-bold tracking-tight text-text-primary md:text-6xl">
          From idea to implementation-ready architecture in minutes
        </h1>
        <p className="hero-subtitle mt-6 text-lg text-text-secondary md:text-xl">
          Foundrie turns your software idea into a complete, diagram-first
          package. Socratic discovery, architecture validation, and a ZIP that
          any coding agent can build from.
        </p>
        <div className="hero-cta mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="group">
              Start Your Project
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
