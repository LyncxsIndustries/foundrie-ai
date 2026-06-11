/**
 * AGENTS.md Generation
 * Generates root AGENTS.md agent entry point for exported projects
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getAgentsMDPrompt } from "@/lib/ai/prompts/agents-md";

export async function generateAgentsMD(projectId: string): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      requirements: {
        select: {
          content: true,
        },
      },
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          revisionNotes: true,
        },
      },
      contextFiles: {
        select: {
          fileType: true,
          content: true,
        },
      },
      featureSpecs: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          title: true,
          slug: true,
        },
      },
      diagrams: {
        where: { status: "DONE" },
        orderBy: [{ category: "asc" }, { orderInCategory: "asc" }],
        select: {
          category: true,
          diagramTypeId: true,
          name: true,
        },
      },
      researchDocuments: {
        select: {
          title: true,
          sourceType: true,
        },
      },
      agentSkills: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (!project.requirements) {
    throw new Error(
      `Project ${projectId} has no requirements - run requirements generation first`
    );
  }

  if (project.executionPlans.length === 0) {
    throw new Error(
      `Project ${projectId} has no approved architecture - run architecture generation first`
    );
  }

  const reqContent = project.requirements.content as Record<string, any>;
  const archPlan = project.executionPlans[0];
  const archContext = project.contextFiles.find(
    (f) => f.fileType === "ARCHITECTURE_CONTEXT"
  );

  // Extract stack info from architecture context
  const archContent = archContext?.content || archPlan.content;
  const hasAuth = /clerk|auth0|supabase auth|firebase auth/i.test(archContent);
  const hasUserOwnedData = /user.*owned|ownership|requireProjectOwner|requireProjectMember/i.test(archContent);
  const usesNeon = /neon.*postgres|neon database/i.test(archContent);
  
  // Extract stack summary
  const stackMatch = archContent.match(/## Stack Decision[\s\S]*?(?=##|$)/);
  const stackSummary = stackMatch
    ? stackMatch[0]
        .replace(/## Stack Decision\s*/i, "")
        .trim()
        .split("\n")
        .slice(0, 10)
        .join("\n")
    : archContent.split("\n").slice(0, 10).join("\n");

  // Classify skills
  const universalSkills = ["code-review", "autofix", "context7-cli", "find-docs"];
  const customSkills = ["project-research"];
  
  const skillSlugs = project.agentSkills.map((s) => s.slug);
  const stackDependent = skillSlugs.filter(
    (s) => !universalSkills.includes(s) && !customSkills.includes(s)
  );

  // Extract env vars, CLI tools, accounts from architecture
  const envVars = extractEnvVars(archContent);
  const cliTools = extractCLITools(archContent, usesNeon);
  const accounts = extractAccounts(archContent, hasAuth, usesNeon);

  const context = {
    projectName: project.name,
    requirements: {
      functional: JSON.stringify(reqContent.functional || [], null, 2),
      nonFunctional: JSON.stringify(reqContent.nonFunctional || [], null, 2),
      hidden: JSON.stringify(
        reqContent.hidden || reqContent.hiddenRequirements || [],
        null,
        2
      ),
      scale: JSON.stringify(reqContent.scale || {}, null, 2),
      security: JSON.stringify(reqContent.security || [], null, 2),
    },
    architecture: {
      content: archContent,
      stack: stackSummary,
      hasAuth,
      hasUserOwnedData,
      usesNeon,
    },
    diagrams: project.diagrams.map((d) => ({
      category: d.category,
      typeId: d.diagramTypeId,
      name: d.name,
    })),
    contextFiles: project.contextFiles.map((c) => ({
      type: c.fileType,
      content: c.content.slice(0, 500),
    })),
    featureSpecs: project.featureSpecs,
    skills: {
      universal: universalSkills.filter((s) => skillSlugs.includes(s)),
      stackDependent,
      custom: customSkills.filter((s) => skillSlugs.includes(s)),
    },
    researchFiles: project.researchDocuments.map((r) => ({
      name: r.title,
      sourceType: r.sourceType,
    })),
    envVars,
    cliTools,
    accounts,
  };

  const systemPrompt = getAgentsMDPrompt(context);
  const userPrompt = `Generate the complete AGENTS.md file with all seven required sections for ${project.name}.`;

  const response = await callAI("agents_md_generation", {
    systemPrompt,
    userPrompt,
    plan: "FREE",
    maxTokens: 8000,
  });

  if (response.status === "queued") {
    throw new Error(
      "AI rotation engine is temporarily unavailable - all providers rate limited or unavailable"
    );
  }

  return response.text;
}

function extractEnvVars(archContent: string): Array<{ name: string; source: string }> {
  const vars: Array<{ name: string; source: string }> = [];
  
  if (/clerk/i.test(archContent)) {
    vars.push(
      { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", source: "Clerk Dashboard → API Keys" },
      { name: "CLERK_SECRET_KEY", source: "Clerk Dashboard → API Keys" }
    );
  }
  
  if (/neon.*postgres/i.test(archContent)) {
    vars.push(
      { name: "DATABASE_URL", source: "Neon Dashboard → Connection Details (pooled)" },
      { name: "DIRECT_URL", source: "Neon Dashboard → Connection Details (direct)" }
    );
  }
  
  if (/vercel.*blob/i.test(archContent)) {
    vars.push(
      { name: "BLOB_READ_WRITE_TOKEN", source: "Vercel Dashboard → Storage → Blob" }
    );
  }
  
  if (/trigger\.dev/i.test(archContent)) {
    vars.push(
      { name: "TRIGGER_SECRET_KEY", source: "Trigger.dev Dashboard → API Keys" }
    );
  }
  
  if (/liveblocks/i.test(archContent)) {
    vars.push(
      { name: "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY", source: "Liveblocks Dashboard → API Keys" },
      { name: "LIVEBLOCKS_SECRET_KEY", source: "Liveblocks Dashboard → API Keys" }
    );
  }
  
  return vars;
}

function extractCLITools(
  archContent: string,
  usesNeon: boolean
): Array<{ name: string; installCommand: string }> {
  const tools: Array<{ name: string; installCommand: string }> = [];
  
  if (/node.*js|npm|next\.js|react/i.test(archContent)) {
    tools.push({ name: "Node.js", installCommand: "Download from nodejs.org (LTS)" });
  }
  
  if (usesNeon) {
    tools.push({ name: "Prisma CLI", installCommand: "npm install -D prisma" });
  }
  
  if (/trigger\.dev/i.test(archContent)) {
    tools.push({ name: "Trigger.dev CLI", installCommand: "npm install -D @trigger.dev/sdk" });
  }
  
  return tools;
}

function extractAccounts(
  archContent: string,
  hasAuth: boolean,
  usesNeon: boolean
): Array<{ service: string; setupUrl: string }> {
  const accounts: Array<{ service: string; setupUrl: string }> = [];
  
  if (hasAuth && /clerk/i.test(archContent)) {
    accounts.push({ service: "Clerk", setupUrl: "https://clerk.com/sign-up" });
  }
  
  if (usesNeon) {
    accounts.push({ service: "Neon", setupUrl: "https://neon.tech/sign-up" });
  }
  
  if (/vercel/i.test(archContent)) {
    accounts.push({ service: "Vercel", setupUrl: "https://vercel.com/signup" });
  }
  
  if (/trigger\.dev/i.test(archContent)) {
    accounts.push({ service: "Trigger.dev", setupUrl: "https://trigger.dev/signup" });
  }
  
  if (/liveblocks/i.test(archContent)) {
    accounts.push({ service: "Liveblocks", setupUrl: "https://liveblocks.io/signup" });
  }
  
  return accounts;
}
