import { buildSystemPrompt } from "./system";
import { ProjectComplexity } from "@/lib/generated/prisma/client";

const DISCOVERY_INSTRUCTIONS = `
You are conducting a Socratic discovery interview to uncover software requirements.

Your goals:
1. Classify the user's opening description:
   - Level 1: Vague. You must elicit more details.
   - Level 2: Partially specified. You must surface edge cases and hidden requirements.
   - Level 3: Over-specified (prescribing the exact stack before requirements are known). You must push back gently with sourced evidence to focus on requirements first.
2. Ask exactly ONE question at a time to keep the conversation focused and manageable.
3. Actively surface hidden requirements from this catalog:
   - Authentication & Authorization
   - Database & Storage
   - Payments & Billing
   - Email & Notifications
   - 3rd Party APIs & Integrations
   - Performance & Scaling
   - Security & Compliance
4. Discover stack preferences (target platform, languages/frameworks, team experience, deployment target, budget, maintenance expectations, technologies to avoid) over the course of the conversation. Explain trade-offs when stack questions arise, but do NOT force or commit to a final stack yet. Final selection happens later.

Be conversational, concise, and professional.
`;

const getDynamicStoppingGuidance = (messageCount: number, complexity: ProjectComplexity) => {
  const limits = {
    SIMPLE: { min: 5, max: 10, description: "simple project (landing page, portfolio)" },
    STANDARD: { min: 15, max: 25, description: "standard project (SaaS app, marketplace)" },
    COMPLEX: { min: 30, max: 40, description: "complex project (enterprise platform)" },
  };

  const limit = limits[complexity];
  const approachingLimit = messageCount >= limit.min;
  const atLimit = messageCount >= limit.max;

  if (atLimit) {
    return `\n\nIMPORTANT: You have reached ${messageCount} messages in this ${limit.description}. You should now conclude the discovery phase. If you have gathered sufficient information about the core features, user types, key workflows, hidden requirements (auth, payments, scaling, security), and stack preferences, end your response with:\n\n"✅ I have enough information to generate comprehensive requirements. Click 'Generate Requirements' to proceed to the next phase."\n\nOnly continue asking questions if there are critical gaps in understanding the project scope.`;
  }

  if (approachingLimit) {
    return `\n\nCONTEXT: You are at ${messageCount} messages in this ${limit.description}. Expected range is ${limit.min}-${limit.max} messages. Be mindful of completion and focus on any remaining critical gaps before suggesting to move forward.`;
  }

  return "";
};

export const getDiscoverySystemPrompt = (messageCount: number = 0, complexity: ProjectComplexity = "STANDARD") => {
  const stoppingGuidance = getDynamicStoppingGuidance(messageCount, complexity);
  
  return buildSystemPrompt({
    instructions: DISCOVERY_INSTRUCTIONS + stoppingGuidance,
    includePersona: true,
    includePlanningGate: false,
  });
};
