import { z } from "zod";

// Base edge data schema
export const BaseEdgeDataSchema = z.object({
  label: z.string().optional(),
});

// UML edges
export const UMLEdgeDataSchema = BaseEdgeDataSchema.extend({
  type: z.enum([
    "association",
    "aggregation",
    "composition",
    "inheritance",
    "dependency",
  ]),
  multiplicity: z.string().optional(),
});

// Sequence message edges
export const SequenceEdgeDataSchema = BaseEdgeDataSchema.extend({
  type: z.enum(["sync", "async", "return"]),
  message: z.string().optional(),
});

// ER relationship edges
export const EREdgeDataSchema = BaseEdgeDataSchema.extend({
  cardinality: z.enum([
    "one-to-one",
    "one-to-many",
    "many-to-one",
    "many-to-many",
  ]),
  sourceCardinality: z.enum(["one", "many", "zero-or-one", "zero-or-many"]).optional(),
  targetCardinality: z.enum(["one", "many", "zero-or-one", "zero-or-many"]).optional(),
});

// C4 relationship edges
export const C4EdgeDataSchema = BaseEdgeDataSchema.extend({
  description: z.string().optional(),
  technology: z.string().optional(),
});

// Export inferred types
export type UMLEdgeData = z.infer<typeof UMLEdgeDataSchema>;
export type SequenceEdgeData = z.infer<typeof SequenceEdgeDataSchema>;
export type EREdgeData = z.infer<typeof EREdgeDataSchema>;
export type C4EdgeData = z.infer<typeof C4EdgeDataSchema>;
