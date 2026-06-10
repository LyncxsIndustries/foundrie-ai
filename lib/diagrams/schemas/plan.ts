import { z } from "zod";
import type { DiagramType } from "../shape-libraries";

export const DiagramJobSchema = z.object({
  diagramTypeId: z.string(),
  category: z.string(),
  name: z.string(),
  folderPath: z.string(),
  fileName: z.string(),
  orderInCategory: z.number().int().min(0),
});

export const DiagramPlanSchema = z.object({
  jobs: z.array(DiagramJobSchema).min(1),
  rationale: z.string().optional(),
});

export type DiagramJob = z.infer<typeof DiagramJobSchema>;
export type DiagramPlan = z.infer<typeof DiagramPlanSchema>;
