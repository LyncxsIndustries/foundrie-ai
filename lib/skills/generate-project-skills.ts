import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";

interface SkillsLock {
  version: number;
  skills: Record<string, { source: string; sourceType: string; skillPath: string }>;
}

interface GeneratedSkill {
  slug: string;
  name: string;
  type: "universal" | "stack-dependent" | "custom";
  content: string;
}

const UNIVERSAL_SKILLS = ["code-review", "autofix", "context7-cli", "find-docs"];

const STACK_SKILL_MAP: Record<string, string[]> = {
  "Next.js": ["next-best-practices", "shadcn", "react-expert"],
  Clerk: ["clerk-setup", "clerk-nextjs-patterns", "clerk-webhooks", "clerk-backend-api"],
  Prisma: ["prisma-upgrade-v7", "prisma-postgres-setup", "prisma-client-api", "prisma-cli"],
  Neon: ["neon-postgres"],
  "Trigger.dev": ["trigger-setup", "trigger-tasks", "trigger-config"],
  Liveblocks: ["liveblocks-best-practices", "yjs-best-practices"],
};

export async function generateProjectSkills(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contextFiles: {
        where: { fileType: "ARCHITECTURE_CONTEXT" },
        select: { content: true },
      },
      requirements: { select: { content: true } },
    },
  });

  if (!project) throw new Error("Project not found");

  const architectureContent = project.contextFiles[0]?.content || "";
  const skills: GeneratedSkill[] = [];

  // Universal skills
  const skillsLock = await readSkillsLock();
  for (const skillSlug of UNIVERSAL_SKILLS) {
    if (skillsLock.skills[skillSlug]) {
      const content = await readSkillContent(skillSlug);
      const name = skillSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      skills.push({ slug: skillSlug, name, type: "universal", content });
    }
  }

  // Stack-dependent skills
  const detectedStacks = detectStacks(architectureContent);
  for (const stack of detectedStacks) {
    const stackSkills = STACK_SKILL_MAP[stack] || [];
    for (const skillSlug of stackSkills) {
      if (skillsLock.skills[skillSlug]) {
        const content = await readSkillContent(skillSlug);
        const name = skillSlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        skills.push({ slug: skillSlug, name, type: "stack-dependent", content });
      }
    }
  }

  // Custom skills
  const projectResearch = generateProjectResearchSkill(project.name);
  skills.push({
    slug: "project-research",
    name: "Project Research",
    type: "custom",
    content: projectResearch,
  });

  // Persist to database
  await db.$transaction([
    db.projectAgentSkill.deleteMany({ where: { projectId } }),
    ...skills.map((skill) =>
      db.projectAgentSkill.create({
        data: {
          projectId,
          slug: skill.slug,
          name: skill.name,
          content: skill.content,
        },
      })
    ),
  ]);

  return skills;
}

async function readSkillsLock(): Promise<SkillsLock> {
  const path = join(process.cwd(), "skills-lock.json");
  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}

async function readSkillContent(skillSlug: string): Promise<string> {
  const path = join(process.cwd(), ".agents/skills", skillSlug, "SKILL.md");
  return readFile(path, "utf-8");
}

function detectStacks(architectureContent: string): string[] {
  const stacks: string[] = [];
  if (/Next\.js|next\.js|nextjs/i.test(architectureContent)) stacks.push("Next.js");
  if (/Clerk/i.test(architectureContent)) stacks.push("Clerk");
  if (/Prisma/i.test(architectureContent)) stacks.push("Prisma");
  if (/Neon/i.test(architectureContent)) stacks.push("Neon");
  if (/Trigger\.dev|trigger\.dev/i.test(architectureContent)) stacks.push("Trigger.dev");
  if (/Liveblocks/i.test(architectureContent)) stacks.push("Liveblocks");
  return stacks;
}

function generateProjectResearchSkill(projectName: string): string {
  return `---
name: project-research
description: "How to use ${projectName}'s research corpus, assets, and Context7 findings"
metadata:
  version: "1.0.0"
  generated: true
---

# Project Research

This project includes a research corpus in \`research/\` with documents, visual assets, and Context7 findings.

## Structure

- \`research/PROJECT_RESEARCH.md\` - Research index and usage rules
- \`research/visual/\` - Visual references (when present)
- \`research/motion/\` - Motion references (when present)
- \`research/technical/\` - Technical research (when present)

## When to Use

- Before implementing visual/motion features cited in specs
- When architecture decisions reference research files
- When feature specs cite specific research assets

## How to Use

1. Read \`research/PROJECT_RESEARCH.md\` first to understand the corpus structure
2. Read relevant research files before implementation
3. Reference paths exactly as shown in feature specs
4. Never invent asset paths — use only documented research

## Policy Enforcement

- All implementations must follow root \`ARTKINS_STYLE_GUIDE.md\`
- Plan approval required before implementation-impacting work
- Use Context7 for current API versions, never rely on memory
`;
}

