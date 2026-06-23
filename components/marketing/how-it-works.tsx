"use client";

import { MessageSquare, Network, Package } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Discovery Interview",
    description:
      "Socratic chat surfaces requirements, hidden constraints, and technical realities without assuming your stack.",
  },
  {
    icon: Network,
    title: "Diagram-First Architecture",
    description:
      "Full UML/C4/ERD suite generated and validated. System context, containers, deployment, feature DAG, security—every diagram your team needs.",
  },
  {
    icon: Package,
    title: "Implementation Package",
    description:
      "Download a complete ZIP: context files, ordered feature specs, diagrams, AGENTS.md, and project-specific skills. Ready for any coding agent.",
  },
];

export function HowItWorks() {
  return (
    <div className="border-t border-border bg-surface-secondary py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
            How Foundrie Works
          </h2>
          <p className="mt-4 text-text-secondary">
            Idea → Diagrams → ZIP. Your pre-IDE architectural workspace.
          </p>
        </div>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10">
                <step.icon className="h-8 w-8 text-accent-primary" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-3 text-text-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
