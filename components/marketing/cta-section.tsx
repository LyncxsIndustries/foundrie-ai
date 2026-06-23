"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <div className="border-t border-border bg-surface-secondary py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
            Ready to build something?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Turn your idea into an implementation-ready package in minutes. No
            credit card required.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button size="lg" className="group">
                Start Your First Project
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
