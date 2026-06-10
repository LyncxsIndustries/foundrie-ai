"use client";

import { Check, PackageSearch } from "lucide-react";

interface ProjectSkill {
  slug: string;
  name: string;
}

interface ProjectSkillsListProps {
  skills: ProjectSkill[];
}

export function ProjectSkillsList({ skills }: ProjectSkillsListProps) {
  // Classify by skill slug patterns
  const universal = skills.filter((s) =>
    ["code-review", "autofix", "context7-cli", "find-docs"].includes(s.slug)
  );
  const custom = skills.filter((s) => s.slug === "project-research");
  const stackDependent = skills.filter(
    (s) => !universal.some((u) => u.slug === s.slug) && !custom.some((c) => c.slug === s.slug)
  );

  if (skills.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border-primary bg-surface-secondary p-4">
        <PackageSearch className="h-5 w-5 text-text-tertiary" />
        <p className="text-sm text-text-secondary">
          No skills generated yet. Generate skills before exporting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Check className="h-5 w-5 text-accent-primary" />
        <h3 className="text-sm font-medium text-text-primary">
          {skills.length} Skills Ready for Export
        </h3>
      </div>

      <div className="space-y-3">
        {universal.length > 0 && (
          <SkillCategory title="Universal" skills={universal.map((s) => s.name)} />
        )}
        {stackDependent.length > 0 && (
          <SkillCategory title="Stack-Dependent" skills={stackDependent.map((s) => s.name)} />
        )}
        {custom.length > 0 && <SkillCategory title="Custom" skills={custom.map((s) => s.name)} />}
      </div>
    </div>
  );
}

function SkillCategory({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div className="rounded-lg border border-border-secondary bg-surface-secondary p-3">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {title}
      </h4>
      <ul className="space-y-1">
        {skills.map((skill) => (
          <li key={skill} className="text-sm text-text-secondary">
            • {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
