"use client";

import { Brain, Shield, Zap, Users, FileCode, Workflow, Network } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Discovery",
    description: "Multi-model rotation ensures every generation completes, no rate limits block your flow.",
  },
  {
    icon: Network,
    title: "12 Diagram Types",
    description: "System Context, C4, ERD, Sequence, State Machine, Deployment, API Map, and more.",
  },
  {
    icon: FileCode,
    title: "Context Files",
    description: "Architecture, UI, code standards, and progress tracker—everything a coding agent needs.",
  },
  {
    icon: Workflow,
    title: "Feature DAG",
    description: "Ordered specs with exact dependencies, file ownership, and acceptance criteria.",
  },
  {
    icon: Users,
    title: "Real-Time Collaboration",
    description: "Live presence, shared canvas editing, and role-based access for your team.",
  },
  {
    icon: Shield,
    title: "Research-Backed",
    description: "Every recommendation cites sources. Context7 version checks prevent stale dependencies.",
  },
];

export function FeaturesGrid() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
            Premium Architecture, Zero Ambiguity
          </h2>
          <p className="mt-4 text-text-secondary">
            Foundrie owns what and why. Your coding agent owns how and when.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-surface p-6 transition-colors hover:bg-surface-secondary"
            >
              <feature.icon className="h-10 w-10 text-accent-primary" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
